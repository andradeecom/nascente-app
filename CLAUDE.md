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

- **atoms**: primitive UI (`Text`, `Button`, `Input`, `Divider`, `Avatar`, `SafeAreaView`) — own their style variants (e.g. `Button` has `variant`/`size` props mapped to `StyleSheet.create` lookups). `SafeAreaView` is a thin `withUnistyles(...)` wrapper over `react-native-safe-area-context`'s so themed backgrounds stay theme-reactive — see the Styling section.
- **molecules**: small compositions of atoms (e.g. `InputField`, `SocialButton`, `SettingsRow`).
- **organisms**: screen-level sections composed from atoms/molecules (e.g. `LoginCard`, `LoginFooter`, `ProfileCard`, `ScreenHeader`).

Screens (`src/app/**`) compose organisms/atoms directly; they hold screen logic (handlers, mutations) and delegate presentation to organisms.

### Route folders with co-located logic

When a screen's handlers/mutations grow beyond trivial, convert the route file into a folder so the logic can be extracted to a hook without leaving `src/app/`: `src/app/login.tsx` → `src/app/login/index.tsx` (the route, UI-only) + `src/app/login/use-login-screen.ts` (the extracted hook). Expo Router resolves `login/index.tsx` to the same `/login` route, so nothing else (e.g. `Stack.Screen name="login"` guards in `_layout.tsx`) needs to change. Use this pattern instead of growing `src/hooks/` with screen-specific hooks that aren't reused elsewhere — only promote a hook to `src/hooks/` if more than one screen needs it.

Both the route file and its co-located hook use **default export** in this pattern — the hook is exempted from the named-export convention below because it's screen-private, not a shared module imported by name from elsewhere.

**Caveat under `(tabs)`:** the `(tabs)` Tabs navigator auto-registers _every_ file in its folder as a screen, so a co-located hook placed directly under it (e.g. `(tabs)/plans/use-plans-screen.ts`) renders as a phantom tab. Two ways to suppress it: (1) for a single-screen folder, register the hook with `href: null` in `(tabs)/_layout.tsx` (`<Tabs.Screen name="plans/use-plans-screen" options={{ href: null }} />`) — lightest, but you must add one entry per co-located file; (2) if the folder has (or grows) sub-routes, give it a nested `_layout.tsx` with a `Stack` (as `settings/` does) — the nested layout scopes route scanning away from the Tabs navigator, so its co-located `use-*-screen.ts` never becomes a tab and needs no `href: null`. Folders nested under a `Stack` (`login/`, `register/`, `settings/`) don't hit this at all.

### Styling — react-native-unistyles

`src/theme/config.ts` calls `StyleSheet.configure` (the side effect that matters — it's imported once, by `src/index.ts`, before the router entry renders) and registers `UnistylesThemes`/`UnistylesBreakpoints` via module augmentation. It composes three themes — `light`, `dark`, `sepia` (sepia reuses the `light` shadows) — each built from shared tokens (`font`, `typography`, `spacing`/`gap`, `radius`, `zIndex`, `opacity`, `motion`, `highlights`) plus a per-theme `colors` and `shadows` pulled from `src/theme/colors.ts` / `shadows.ts`. Token files live individually in `src/theme/` (`font.ts`, `typography.ts`, `spacing.ts`, `radius.ts`, `z-index.ts`, `opacity.ts`, `motion.ts`, `colors.ts`, `shadows.ts`) — add new tokens to the relevant file and wire them into `sharedTokens`/the per-theme objects in `config.ts`.

Components style with `StyleSheet.create((theme) => ({...}))` from `react-native-unistyles`, never `react-native`'s `StyleSheet`. Color tokens are nested under `theme.colors.semantic.*` (e.g. `bgPrimary`, `bgSecondary`, `textPrimary`, `accent`, `accentSubtle`, `danger`) — components should read `theme.colors.semantic.X`, not the flat shadcn-style aliases (`primary`, `accent`, `muted`, etc.) that also exist on the color object for reference/legacy parity. Always pull tokens off `theme` (`theme.spacing[4]`, `theme.colors.semantic.bgPrimary`) rather than hardcoding values.

**The Babel plugin is mandatory.** `babel.config.js` registers `react-native-unistyles/plugin` (`root: 'src'`) — this is what binds native ShadowNodes so `UnistylesRuntime.setTheme()` repaints live. Without it, theme changes only apply after a full JS reload. The plugin must run _before_ React Compiler; we satisfy this by keeping React Compiler inside `babel-preset-expo` (the `experiments.reactCompiler` flag in `app.json`) and Unistyles at the top level — Babel runs top-level plugins before preset plugins. **Don't** also add `babel-plugin-react-compiler` manually (it would double-apply). After editing `babel.config.js` or fonts, restart Metro with a cache clear (`pnpm start -c`); font/`app.json` changes additionally need a native rebuild (`pnpm ios`).

**Reactivity model & third-party components.** Unistyles v3 updates styles natively without re-rendering React, but the plugin only auto-processes components imported from `react-native`. A themed style on a **third-party** component (e.g. `SafeAreaView` from `react-native-safe-area-context`, which wraps a native view, not RN's `View`) or on a **navigator options object** (`Tabs`/`Stack` `screenOptions`) will keep its first-render colors and won't switch theme live. Two patterns handle this:

- **SafeAreaView:** use the themed atom `src/components/atoms/SafeAreaView.tsx` (a `withUnistyles(...)` wrapper that subscribes to the runtime). Always import `SafeAreaView` from `@/components/atoms`, never from `react-native-safe-area-context` directly.
- **Navigator options:** subscribe to the theme name (`useThemeStore((s) => s.theme)`) and read colors via `UnistylesRuntime.getTheme(themeName)`, then build `screenOptions` from those — making the colors a real dependency so the options recompute on theme change (see `src/app/(tabs)/_layout.tsx`). A bare `useThemeStore` subscription alone isn't enough: React Compiler memoizes the options object as stable because `styles.X` is a stable reference.

**Fonts.** Reader fonts are variable fonts (`Literata`, `Source Serif 4`) plus `Lato`, registered in `app.json` via the `expo-font` plugin and referenced in `src/theme/typography.ts` / `font.ts` by their **real family name (OpenType name ID 1)** — `'Literata'`, `'Source Serif 4'` (note the spaces), `'Lato'` — never the per-file PostScript name (`'Literata-Regular'`, `'SourceSerif4Roman-Regular'`). Referencing the PostScript name pins the font to its static 400 instance, and RN then synthesizes bogus names like `Literata-Regular_Medium` so `fontWeight` silently drops; referencing the family name lets `fontWeight` drive the variable `wght` axis (Lato is non-variable, weight 400 only). When inspecting a new font, read its name table to get the family name before wiring it up. Adding/renaming fonts means editing `app.json` + a native rebuild.

### Navigation headers

The app does **not** use React Navigation's built-in headers — stacks set `headerShown: false` (e.g. `src/app/(tabs)/settings/_layout.tsx`) and screens render the custom `ScreenHeader` organism (`src/components/organisms/ScreenHeader.tsx`: themed back chevron + centered title, top safe-area) instead. This keeps headers fully theme-reactive (the native nav header isn't a Unistyles surface) and consistent with the design system. Build new in-screen headers with `ScreenHeader`, not navigator `options.title`/`headerShown`.

### Auth flow — Supabase Auth

Layered: screens (`src/app/login/`, `src/app/register/`, `src/app/forgot-password/`) → `src/hooks/use-auth.ts` (React Query mutations/queries + Zustand writes) → `src/lib/supabase.ts` (`supabase.auth.*` calls directly — there is no service module for auth; Supabase's SDK _is_ the service layer).

- `src/lib/supabase.ts` creates the single `supabase` client via `createClient`, configured with `AsyncStorage` as the session storage, `autoRefreshToken: true`, `persistSession: true`. Supabase's client handles token persistence and refresh internally — there is no custom axios instance, manual token storage, or refresh-queue logic for auth.
- `useAuthStore` (`src/stores/auth.ts`, Zustand) holds `user` (an `AppUser`, see below), `isAuthenticated`, `isHydrated`. `hydrate()` calls `supabase.auth.getSession()` once on launch, then subscribes via `supabase.auth.onAuthStateChange` so any session change (refresh, sign-out, cross-tab) keeps the store in sync automatically — mutations don't need to manually push user state on top of what the listener already does, though `onSuccess` handlers in `use-auth.ts` call `setAuth` directly too so the UI updates without waiting on the listener's async round-trip.
- `src/app/_layout.tsx` calls `hydrate()` once via a `useHydrate` hook defined inline. While `!isHydrated` it renders `null` (holding the native splash screen, via `expo-splash-screen`'s `preventAutoHideAsync`); once hydrated, it renders the animated `SplashScreen` organism (`src/components/organisms/SplashScreen.tsx`) until it signals `onReady` (hides the native splash) and `onFinish` (flips local `splashDone` state). Only then does it mount the `Stack`, which uses `Stack.Protected` guards keyed on `isAuthenticated` to show either `(tabs)` or the unauthenticated screens (`login`, `register`, `forgot-password`) — there is no separate auth-guard hook or redirect call.
- `useLogin`/`useRegister`/`useGoogleLogin` all call the corresponding `supabase.auth.*` method (`signInWithPassword`, `signUp`, `signInWithIdToken`), map the returned Supabase `User` to the app's `AppUser` via `toAppUser()` (`src/types/auth.ts`), then `setAuth` + `queryClient.setQueryData(authKeys.me, user)` in `onSuccess`.
- `useForgotPassword` calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'nascenteapp://reset-password' })` — the `nascenteapp` scheme is registered in `app.json`. This only sends the email; there's no in-app reset-completion screen yet (the linked flow is out of scope until that's built).
- `useMockLogin` is a `__DEV__`-only escape hatch (wired into `src/app/login/`) that writes a hardcoded `AppUser` straight to the Zustand store and query cache, bypassing Supabase entirely — use this pattern for any other dev-only shortcuts.
- `useLogout` calls `supabase.auth.signOut()`, then clears the Zustand store and the whole React Query cache.
- Google sign-in uses `@react-native-google-signin/google-signin` for the native dialog (configured once at module load in `use-auth.ts` from `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` / `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` env vars), then exchanges the resulting ID token with Supabase via `signInWithIdToken({ provider: 'google', token })`. Apple Sign-In is wired up as a no-op handler (`handleAppleLogin` — TODO, not implemented) in both `login/use-login-screen.ts` and `register/use-register-screen.ts`.
- Email confirmation is currently **disabled** in the Supabase project, so `signUp` returns an active session immediately and Register signs the user straight into `(tabs)` — there's no "check your email to confirm" step. If that setting changes, `useRegister`'s `onSuccess` needs to branch on whether `data.session` is null.
- Three auth screens follow the same route-folder pattern (see "Route folders with co-located logic" above): `login/`, `register/`, `forgot-password/`. `LoginCard`'s `onForgotPassword` navigates to `/forgot-password`; `login/index.tsx` and `register/index.tsx` cross-link to each other via `expo-router`'s `Link`.

### Forms & validation

React Hook Form + Zod, wired through `@hookform/resolvers`. Schemas live in `src/schemas/` as factory functions (`createLoginSchema()`, not a static export) because validation messages call `translate(...)` and need to read the current i18n locale at schema-creation time, not at module-load time.

### i18n

`src/i18n/` wraps `i18n-js`. `src/i18n/index.ts` barrels `i18n.ts` (instance config) and `translate.ts` (helper). Initial locale is set in `src/app/_layout.tsx` from `expo-localization`'s `getLocales()`, with fallback enabled; the user's choice is persisted in `useLocaleStore` (`src/stores/locale.ts`), which writes `i18n.locale` on change/rehydrate. Translation keys live per-locale in `src/i18n/translations/{en,es,pt}.ts`; add new keys to all three.

**Two ways to translate — pick by whether the text must update on a live language switch:**

- **`useTranslate()` hook** (returns a `translate` function) in any component whose text must re-render when the user changes language. It subscribes to `useLocaleStore` and returns a **locale-keyed closure**. The closure's per-locale identity is deliberate: with the stable module-level `translate`, React Compiler memoizes `translate('constant-key')` call sites as pure (it can't see that the helper reads i18n's mutable locale) and the strings only refresh after a full reload. Do not "simplify" the hook back to returning the bare `translate`.
- **Raw `translate(...)`** (imported from `@/i18n`) only where a live switch can't happen at that point: module scope, Zod schema factories (recreated per render, so they pick up the current locale anyway), and the logged-out auth screens (unreachable from the in-app language switcher).

**Require-cycle rule:** import the i18n instance from `@/i18n/i18n` (the file), not the `@/i18n` barrel, in any module the barrel transitively imports — notably `src/stores/locale.ts`. The barrel re-exports `use-translate.ts`, which imports the locale store, so importing the barrel back from the store creates a `i18n → use-translate → locale → i18n` cycle.

### Data fetching

TanStack Query. `src/lib/query-client.ts` provides the single `queryClient` instance (provided via `QueryClientProvider` in `_layout.tsx`). Query keys are namespaced per domain as `const` objects (see `authKeys` in `use-auth.ts`) — follow that convention for new domains rather than inlining key arrays.

### Backend — Supabase

`src/lib/supabase.ts` is the single Supabase client (Auth today; DB/RLS-backed tables from `.docs/data-model.md` — highlights, notes, bookmarks, reading plan progress — are not wired up yet). There is no `src/services/` layer for auth — hooks in `src/hooks/use-auth.ts` call `supabase.auth.*` directly, since the Supabase SDK already provides the typed, hook-friendly API that a hand-rolled service module would otherwise wrap. If DB access is added later and warrants a thin wrapper per domain, mirror the old `src/services/*.ts` convention then — don't add it speculatively now.

### Type/schema layout

Domain types live in `src/types/*.ts`. `types/auth.ts` defines `AppUser` (the app's user shape: `id`, `email`, `firstName`, `lastName`, `profileImageUrl`) mapped from Supabase's `User.user_metadata` via `toAppUser()`, plus `RegisterRequest`. Prefer Supabase SDK types (`User`, `Session`, `AuthError` from `@supabase/supabase-js`) directly where the app doesn't need a narrower shape — `AppUser` exists specifically because components (`ProfileCard`, `(tabs)/index.tsx`) read `firstName`/`lastName`/`profileImageUrl` as top-level fields rather than reaching into `user_metadata`. Import types with `import type`.

### Home screen

The Home tab (`src/app/(tabs)/index.tsx`) composes five extracted organisms — `WelcomeHeader`, `VerseOfTheDayCard`, `ContinueReadingCard`, `StatsRow`, `ActivePlansSection` — plus an inline **Pro CTA card**. Screen logic lives in `src/hooks/use-home-screen.ts`.

**TODO — Pro CTA:** The Pro upgrade card currently renders unconditionally. Once subscription/premium state is available (e.g. via a `useSubscriptionStore` or user profile field), wrap the Pro CTA in a conditional so it only shows for free-tier users. Per the product spec (`.docs/user-flows/home.md`), the home screen should show at most one Pro nudge and never repeat it or use interstitials.

**TODO — Stats:** Progress percentage, reading streak, and highlights count are placeholder zeros. Wire them to real tracking once the corresponding stores/services are implemented.

## Conventions

- ESLint config (`eslint.config.js`) is `eslint-config-expo` flat config + Prettier + `eslint-plugin-react-compiler` (recommended ruleset is enforced — write components compatible with the React Compiler, e.g. no manual memoization workarounds it would conflict with).
- Prettier: single quotes, semicolons, 120 print width, ES5 trailing commas, LF line endings (`.prettierrc`).
- Components/hooks/services follow named exports (no default exports except Expo Router screens, which require default export, and their co-located screen-private hooks — see "Route folders with co-located logic" above).
