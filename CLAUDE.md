# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Expo + React Native + TypeScript app for **Nascente**, an offline-first Bible app (see `../CLAUDE.md` and `../.docs/` for product context). This package currently implements the auth shell and design system; Bible reading/study features are not yet built. Entry point is `src/index.ts` (which imports `expo-router/entry` then `./theme/config` to initialize Unistyles before anything renders). Routing is file-based via `expo-router` (`src/app/`). Uses pnpm as package manager.

## Commands

```bash
pnpm start              # expo start (dev server)
pnpm ios                # expo run:ios
pnpm android            # expo run:android
pnpm web                # expo start --web
pnpm lint               # expo lint
pnpm format             # prettier --write "**/*.{ts,tsx,js,jsx}"
pnpm update:deps        # expo install --check (use instead of manually bumping deps)
pnpm clean-install      # scripts/clean-and-reinstall.sh — wipes node_modules/lockfile and reinstalls
```

There is no test runner configured in this template.

Husky + lint-staged run `prettier --write` and `expo lint --fix` on staged `*.{js,jsx,ts,tsx}` files on every commit (`.husky/pre-commit`). Node version is pinned via `.nvmrc` (24.17.0); `engines.node` in `package.json` requires `>= 24.17.0`.

## Architecture

### Path aliases
`@/*` maps to `src/*`, `@/assets/*` maps to `assets/*` (see `tsconfig.json`). Always import via `@/...`, never relative paths across top-level folders.

### Component layers (atomic design)
`src/components/` is split into `atoms/`, `molecules/`, `organisms/`, each with a barrel `index.ts` that re-exports named exports. When adding a component, add it to the matching folder's `index.ts`.

- **atoms**: primitive UI (`Text`, `Button`, `Input`, `Divider`, `Avatar`) — own their style variants (e.g. `Button` has `variant`/`size` props mapped to `StyleSheet.create` lookups).
- **molecules**: small compositions of atoms (e.g. `InputField`, `SocialButton`).
- **organisms**: screen-level sections composed from atoms/molecules (e.g. `LoginCard`, `LoginFooter`, `ProfileCard`).

Screens (`src/app/**`) compose organisms/atoms directly; they hold screen logic (handlers, mutations) and delegate presentation to organisms.

### Route folders with co-located logic
When a screen's handlers/mutations grow beyond trivial, convert the route file into a folder so the logic can be extracted to a hook without leaving `src/app/`: `src/app/login.tsx` → `src/app/login/index.tsx` (the route, UI-only) + `src/app/login/use-login-screen.ts` (the extracted hook). Expo Router resolves `login/index.tsx` to the same `/login` route, so nothing else (e.g. `Stack.Screen name="login"` guards in `_layout.tsx`) needs to change. Use this pattern instead of growing `src/hooks/` with screen-specific hooks that aren't reused elsewhere — only promote a hook to `src/hooks/` if more than one screen needs it.

Both the route file and its co-located hook use **default export** in this pattern — the hook is exempted from the named-export convention below because it's screen-private, not a shared module imported by name from elsewhere.

### Styling — react-native-unistyles
`src/theme/config.ts` calls `StyleSheet.configure` (the side effect that matters — it's imported once, by `src/index.ts`, before the router entry renders) and registers `UnistylesThemes`/`UnistylesBreakpoints` via module augmentation. It composes three themes — `light`, `dark`, `sepia` (sepia reuses the `light` shadows) — each built from shared tokens (`font`, `typography`, `spacing`/`gap`, `radius`, `zIndex`, `opacity`, `motion`, `highlights`) plus a per-theme `colors` and `shadows` pulled from `src/theme/colors.ts` / `shadows.ts`. Token files live individually in `src/theme/` (`font.ts`, `typography.ts`, `spacing.ts`, `radius.ts`, `z-index.ts`, `opacity.ts`, `motion.ts`, `colors.ts`, `shadows.ts`) — add new tokens to the relevant file and wire them into `sharedTokens`/the per-theme objects in `config.ts`.

Components style with `StyleSheet.create((theme) => ({...}))` from `react-native-unistyles`, never `react-native`'s `StyleSheet`. Color tokens are nested under `theme.colors.semantic.*` (e.g. `bgPrimary`, `bgSecondary`, `textPrimary`, `accent`, `accentSubtle`, `danger`) — components should read `theme.colors.semantic.X`, not the flat shadcn-style aliases (`primary`, `accent`, `muted`, etc.) that also exist on the color object for reference/legacy parity. Always pull tokens off `theme` (`theme.spacing[4]`, `theme.colors.semantic.bgPrimary`) rather than hardcoding values.

### Auth flow
Layered: `src/app/login.tsx` (screen) → `src/hooks/use-auth.ts` (React Query mutations/queries + Zustand writes) → `src/services/auth.ts` (`authApi`, raw HTTP calls) → `src/lib/api-client.ts` (axios instance).

- `useAuthStore` (`src/stores/auth.ts`, Zustand) holds `user`, `isAuthenticated`, `isHydrated` in memory. `hydrate()` reads the persisted token (`src/lib/secure-store.ts`, Expo SecureStore) and user (`src/lib/user-storage.ts`) on launch.
- `src/app/_layout.tsx` calls `hydrate()` once via a `useHydrate` hook defined inline. While `!isHydrated` it renders `null` (holding the native splash screen, via `expo-splash-screen`'s `preventAutoHideAsync`); once hydrated, it renders the animated `SplashScreen` organism (`src/components/organisms/SplashScreen.tsx`) until it signals `onReady` (hides the native splash) and `onFinish` (flips local `splashDone` state). Only then does it mount the `Stack`, which uses `Stack.Protected` guards keyed on `isAuthenticated` to show either `(tabs)` or `login` — there is no separate auth-guard hook or redirect call.
- `api-client.ts` attaches the bearer token to every request and implements silent-refresh-on-401 with a request queue (so concurrent 401s only trigger one refresh call).
- Login/Google-login mutations persist the token + user (secure store + `user-storage`) and sync both the Zustand store and the React Query cache (`authKeys.me`) so `useMe()` doesn't have to refetch immediately.
- `useMockLogin` is a `__DEV__`-only escape hatch (wired into `src/app/login.tsx`) that signs in a hardcoded mock user without hitting the network — use this pattern for any other dev-only shortcuts.
- Logout clears secure store, stored user, cookies (`react-native-nitro-cookies`), the Zustand store, and the whole React Query cache.
- Google sign-in uses `@react-native-google-signin/google-signin`, configured once at module load in `use-auth.ts` from `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` / `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` env vars. Apple Sign-In is wired up as a no-op handler in `login.tsx` (`handleAppleLogin` — TODO, not implemented).

### Forms & validation
React Hook Form + Zod, wired through `@hookform/resolvers`. Schemas live in `src/schemas/` as factory functions (`createLoginSchema()`, not a static export) because validation messages call `translate(...)` and need to read the current i18n locale at schema-creation time, not at module-load time.

### i18n
`src/i18n/` wraps `i18n-js`. `src/i18n/index.ts` barrels `i18n.ts` (instance config) and `translate.ts` (helper). Locale is set once in `src/app/_layout.tsx` from `expo-localization`'s `getLocales()`, with fallback enabled. Translation keys live per-locale in `src/i18n/translations/{en,es,pt}.ts`; add new keys to all three.

### Data fetching
TanStack Query. `src/lib/query-client.ts` provides the single `queryClient` instance (provided via `QueryClientProvider` in `_layout.tsx`). Query keys are namespaced per domain as `const` objects (see `authKeys` in `use-auth.ts`) — follow that convention for new domains rather than inlining key arrays.

### Networking
All HTTP goes through the single `apiClient` axios instance (`src/lib/api-client.ts`); `API_BASE_URL` is hardcoded there (`http://localhost:3001/api`) pointing at a proprietary backend. Service modules (`src/services/*.ts`) wrap `apiClient` calls per domain and return typed data; hooks call services, never axios directly.

### Type/schema layout
Domain types live in `src/types/*.ts` (e.g. `User`, `LoginRequest`, `LoginResponse` in `types/auth.ts`), imported with `import type`. Keep request/response shapes here rather than inferring them from Zod schemas, since schemas are form-validation-only.

## Conventions

- ESLint config (`eslint.config.js`) is `eslint-config-expo` flat config + Prettier + `eslint-plugin-react-compiler` (recommended ruleset is enforced — write components compatible with the React Compiler, e.g. no manual memoization workarounds it would conflict with).
- Prettier: single quotes, semicolons, 120 print width, ES5 trailing commas, LF line endings (`.prettierrc`).
- Components/hooks/services follow named exports (no default exports except Expo Router screens, which require default export, and their co-located screen-private hooks — see "Route folders with co-located logic" above).
