# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Expo + React Native + TypeScript app for **Nascente**, an offline-first Bible app (see `../CLAUDE.md` and `../.docs/` for product context). This package implements: a multi-step **onboarding** flow, **Supabase auth** (sign-in / sign-up / password reset), the **Reader** (offline bundled Bible) with **verse highlighting**, **reading plans** with progress tracking, a **Study** tab (highlights, account-gated), **settings**, and the design system. AI study features (explain, word study, devotionals) are not built yet. Entry point is `src/index.ts` (which imports `expo-router/entry` then `./theme/config` to initialize Unistyles before anything renders). Routing is file-based via `expo-router` (`src/app/`). Uses pnpm as package manager.

**Guest-first:** the app no longer requires an account. After onboarding, guests land in `(tabs)` and can read, browse plans, and change settings; account-gated surfaces (reading-plan progress/sync, cross-device stats) show contextual sign-in prompts (`SignInPromptCard`) instead of blocking. See the Auth flow, Home screen, and Reading plans sections.

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
- **molecules**: small compositions of atoms (e.g. `InputField`, `SocialButton`, `SettingsRow`, `OnboardingStepHeader`, `BackButton`). `BackButton` is a floating top-left chevron that renders `null` when `router.canGoBack()` is false — used on the auth screens (which center their own content and don't use the titled `ScreenHeader`).
- **organisms**: screen-level sections composed from atoms/molecules (e.g. `LoginCard`, `RegisterCard`, `ScreenHeader`, `ActivePlanCard`, `SuggestedPlanCard`, `SignInPromptCard`, `VerseActionSheet`). `SignInPromptCard` is the reusable account-gate card (whole card is the CTA) used on the Plans tab, Home, and Study tab for guests. `VerseActionSheet` is the highlight color-picker bottom sheet opened from a verse tap in the Reader (see Reader + Study tools).

Screens (`src/app/**`) compose organisms/atoms directly; they hold screen logic (handlers, mutations) and delegate presentation to organisms.

### Route folders with co-located logic

When a screen's handlers/mutations grow beyond trivial, convert the route file into a folder so the logic can be extracted to a hook without leaving `src/app/`: `src/app/login.tsx` → `src/app/login/index.tsx` (the route, UI-only) + `src/app/login/use-login-screen.ts` (the extracted hook). Expo Router resolves `login/index.tsx` to the same `/login` route, so nothing else (e.g. `Stack.Screen name="login"` guards in `_layout.tsx`) needs to change. Use this pattern instead of growing `src/hooks/` with screen-specific hooks that aren't reused elsewhere — only promote a hook to `src/hooks/` if more than one screen needs it.

Both the route file and its co-located hook use **default export** in this pattern — the hook is exempted from the named-export convention below because it's screen-private, not a shared module imported by name from elsewhere.

**Caveat under `(tabs)`:** the `(tabs)` Tabs navigator auto-registers _every_ file directly in its folder as a screen, so a co-located hook placed directly under it would render as a phantom tab. Two ways to suppress it: (1) for a single file, register it with `href: null` in `(tabs)/_layout.tsx` — lightest; (2) give the tab a nested `_layout.tsx` with a `Stack`, which scopes route scanning away from the Tabs navigator so co-located `use-*-screen.ts` files (and sub-routes like `plans/[planId]/`) never become tabs. **Current layout:** the Home tab is the only bare file (`(tabs)/index.tsx`); its logic lives in `src/hooks/use-home-screen.ts` (outside `(tabs)/`) to avoid the phantom. `reader/`, `plans/`, and `settings/` each have a nested `Stack` `_layout.tsx`, so their co-located hooks and sub-routes are safe. Folders nested under a `Stack` (`login/`, `register/`, `forgot-password/`, the `onboarding/*` folders) don't hit this at all.

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

- `src/lib/supabase.ts` creates the single `supabase` client via `createClient`, configured with `AsyncStorage` as the session storage, an explicit `storageKey` (exported as `AUTH_STORAGE_KEY = 'nascente-auth'`, pinned so logout can hard-purge the token by prefix instead of guessing the derived `sb-<ref>-auth-token` default), `autoRefreshToken: true`, `persistSession: true`. Supabase's client handles token persistence and refresh internally — there is no custom axios instance, manual token storage, or refresh-queue logic for auth.
- `useAuthStore` (`src/stores/auth.ts`, Zustand) holds `user` (an `AppUser`, see below), `isAuthenticated`, `isHydrated`. `hydrate()` calls `supabase.auth.getSession()` once on launch, then subscribes via `supabase.auth.onAuthStateChange` so any session change (refresh, sign-out, cross-tab) keeps the store in sync automatically — mutations don't need to manually push user state on top of what the listener already does, though `onSuccess` handlers in `use-auth.ts` call `setAuth` directly too so the UI updates without waiting on the listener's async round-trip.
- `src/app/_layout.tsx` calls `hydrate()` once via a `useHydrate` hook defined inline. While `!isHydrated` it renders `null` (holding the native splash screen, via `expo-splash-screen`'s `preventAutoHideAsync`); once hydrated, it renders the animated `SplashScreen` organism (`src/components/organisms/SplashScreen.tsx`) until it signals `onReady` (hides the native splash) and `onFinish` (flips local `splashDone` state). Only then does it mount the `Stack`.
- **Routing guards are keyed on onboarding, not auth.** The `Stack` has two `Stack.Protected` groups: one gated on `shouldShowOnboarding` (`FORCE_ONBOARDING` dev flag OR `!hasCompleted` from `useOnboardingStore`) showing `onboarding`; the other gated on `!shouldShowOnboarding` showing the app — `(tabs)`, `login`, `register`, `forgot-password` **together in one group**. So a signed-out guest still reaches `(tabs)` (initial route); `login`/`register`/`forgot-password` are optional screens pushed on top (e.g. from settings). Signing in/out does **not** swap the navigator — screens navigate explicitly (see redirect bullet). There is no auth-guard hook or redirect call in `_layout.tsx`.
- `useLogin`/`useRegister`/`useGoogleLogin` all call the corresponding `supabase.auth.*` method (`signInWithPassword`, `signUp`, `signInWithIdToken`), map the returned Supabase `User` to the app's `AppUser` via `toAppUser()` (`src/types/auth.ts`), then `setAuth` + `queryClient.setQueryData(authKeys.me, user)` in `onSuccess`.
- `useForgotPassword` calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'nascenteapp://reset-password' })` — the `nascenteapp` scheme is registered in `app.json`. This only sends the email; there's no in-app reset-completion screen yet (the linked flow is out of scope until that's built).
- `useMockLogin` is a `__DEV__`-only escape hatch (wired into `src/app/login/`) that writes a hardcoded `AppUser` straight to the Zustand store and query cache, bypassing Supabase entirely — use this pattern for any other dev-only shortcuts.
- `useLogout` does three things in order: (1) clear the Zustand store + the whole React Query cache (instant UI flip to guest, no previous-user data lingering e.g. on the Plans tab); (2) best-effort `supabase.auth.signOut()` in a `try/catch` (remote revoke; throws for a mock-login user or offline); (3) **hard-purge** the persisted session — `AsyncStorage.multiRemove` of every key starting with `AUTH_STORAGE_KEY` (covers the session + its `-code-verifier` sibling). Step 3 is the real guarantee: a failed/offline remote sign-out can't leave a token for `hydrate()` to restore on relaunch.
- Google sign-in uses `@react-native-google-signin/google-signin` for the native dialog (configured once at module load in `use-auth.ts` from `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` / `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` env vars), then exchanges the resulting ID token with Supabase via `signInWithIdToken({ provider: 'google', token })`. Apple Sign-In is wired up as a no-op handler (`handleAppleLogin` — TODO, not implemented) in both `login/use-login-screen.ts` and `register/use-register-screen.ts`.
- Email confirmation is currently **disabled** in the Supabase project, so `signUp` returns an active session immediately — there's no "check your email to confirm" step. If that setting changes, `useRegister`'s `onSuccess` needs to branch on whether `data.session` is null.
- **Redirect-on-success (because the navigator doesn't swap on auth):** the root `login/`/`register/` screens are reached as a guest from settings, pushed on top of `(tabs)`. Their hooks call a `goToApp()` on success — `router.canDismiss() ? router.dismissAll() : router.replace('/(tabs)/settings')` — which closes the pushed auth stack and lands back on settings (now showing the signed-in profile card). The dev `mockLogin` is wrapped the same way. The **onboarding** copies of these screens redirect to `/onboarding/welcome` instead (see Onboarding flow).
- **Root auth screens** (`login/`, `register/`, `forgot-password/`) follow the route-folder pattern, render a `BackButton` (so a guest who entered from settings can return), and cross-link: `LoginCard.onForgotPassword` → `/forgot-password`, login ⇄ register via `Link`. `useMockLogin` and Apple Sign-In (no-op TODO) are wired here and in the onboarding copies.

### Onboarding flow

First-run flow under `src/app/onboarding/` (gated by the `shouldShowOnboarding` guard; `hasCompleted` lives in `useOnboardingStore`, `src/stores/onboarding.ts`). Each step is a route-folder with a co-located `use-*-screen.ts` hook, and most steps use `OnboardingStepHeader` (progress dots + back). Sequence:

`language (1) → translation (2) → preferences (3) → account (4) → [register | login | forgot-password] → welcome → app`

- **account** (`onboarding/account/`) — "Sincronize seus dados": **Criar conta** → pushes the onboarding `register`; **Usar sem conta** → pushes `welcome` (guest). Caption notes an account can be created later in settings.
- **account/register, account/login, account/forgot-password** — reuse the same `RegisterCard` / `LoginCard` / `ForgotPasswordCard` organisms as the root auth screens, but their hooks redirect to `/onboarding/welcome` on success (existing-account users can cross-link register ⇄ login, and login → forgot-password, all within the onboarding stack since the root `/login` etc. aren't mounted during onboarding).
- **welcome** (`onboarding/welcome/`) — final celebratory screen (animated "sun" sunburst via `react-native-reanimated` + `react-native-svg`, twinkling stars, pulsing button glow). **Começar a ler** → `complete()` + `router.replace('/(tabs)')`; **Explorar planos de leitura** → `complete()` + `/(tabs)/plans`.

`complete()` is called only at the welcome CTA, so the onboarding stack stays mounted through account/register/welcome without a premature guard switch.

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

`src/lib/supabase.ts` is the single Supabase client. **Auth** and the **reading-plan tables** (`reading_plans`, `reading_plan_days`, `user_reading_plans`, `user_reading_plan_completions` — see `.docs/data-model.md`) are wired up. **Highlights are implemented local-first** (on-device only — see Study tools), so the backend `highlights` table stays **DRAFT** until the later sync; notes / bookmarks are still **DRAFT** too (not applied). Generated DB types live in `src/types/database.types.ts` (regenerate via the Supabase MCP `generate_typescript_types` after any DDL). Reading-plan queries/mutations live in `src/hooks/use-reading-plans.ts` and call `supabase.from(...)` directly (no `src/services/` layer) — same rationale as auth. Plan progress tracking is **online-only today**; `.docs/plans-progress-tracking.md` is the blueprint for the later offline-first (SQLite + sync) migration, which is why completions are treated as the authoritative append-only log and `current_day`/`status`/`progress` are derived.

### Type/schema layout

Domain types live in `src/types/*.ts`. `types/auth.ts` defines `AppUser` (the app's user shape: `id`, `email`, `firstName`, `lastName`, `profileImageUrl`) mapped from Supabase's `User.user_metadata` via `toAppUser()`, plus `RegisterRequest`. Prefer Supabase SDK types (`User`, `Session`, `AuthError` from `@supabase/supabase-js`) directly where the app doesn't need a narrower shape — `AppUser` exists specifically because components (`ProfileCard`, `(tabs)/index.tsx`) read `firstName`/`lastName`/`profileImageUrl` as top-level fields rather than reaching into `user_metadata`. Import types with `import type`.

### Home screen

The Home tab (`src/app/(tabs)/index.tsx`) composes `WelcomeHeader`, `VerseOfTheDayCard`, `ContinueReadingCard`, `StatsRow`, and either `ActivePlansSection` (signed-in) or `SignInPromptCard` (guest), plus an inline **Pro CTA card**. Screen logic lives in `src/hooks/use-home-screen.ts` (exposes `isAuthenticated` + handlers `handleSignIn` → `/register`, `handleOpenPlan(planId)` → `/(tabs)/plans/[planId]`).

**Guest vs. signed-in (gated on `isAuthenticated`):**

- **Active plans slot:** guests see a `SignInPromptCard` (icon `CalendarCheck`) in place of `ActivePlansSection` — plans need an account, so the empty state becomes a contextual CTA. Signed-in users see their real active plans (tapping a card → plan detail).
- **Stats (`StatsRow`):** **Progress** and **Streak** are **local-first**, real for everyone (guests included) — no sign-in gate; both come from `useReadingProgressStore` (`src/stores/reading-progress.ts`, persisted): Progress = `readChapters / TOTAL_BIBLE_CHAPTERS` (1189), Streak = consecutive reading days. **Highlights** is the real count for signed-in users (`useCurrentUserHighlights().length`); guests see a muted `—` (highlighting is account-gated — `StatsRow` `Stat.muted` dims that tile).
- **Pro CTA:** hidden for guests (`{isAuthenticated && …}`) — don't stack a paid upsell on top of the create-account nudge. Still renders unconditionally for signed-in users.

**TODO — Pro CTA gating:** for signed-in users the Pro card renders unconditionally; once subscription state exists, gate it to non-premium users. Per `.docs/user-flows/home.md`, show at most one Pro nudge, never interstitials.

### Reading progress tracking (local-first)

`src/stores/reading-progress.ts` (persisted Zustand) is the on-device source of truth for the Home stats — no account required. `readChapters` (keyed `${bookId}:${chapter}`, translation-independent) and `readDays` (`YYYY-MM-DD`) are written by `markChapterRead(bookId, chapter)`, called from the Reader via an effect when a chapter's verses are on screen (which also stamps "read today" for the streak). `computeStreak()` returns consecutive reading days ending today or yesterday. This is deliberately local-first so it works offline and for guests; a future account would **sync** it (same pattern as `.docs/plans-progress-tracking.md`), not gate it.

### Reading plans

Plans tab under `src/app/(tabs)/plans/` (nested `Stack`). Data layer is `src/hooks/use-reading-plans.ts` (`planKeys` namespace): `useActivePlans`, `useSuggestedPlans`, `useStartPlan`, `usePlanDetail(planId)`, `useMarkPlanDayComplete`, `useArchivePlan`. View-models (`ActiveReadingPlan`, `PlanDayGroup`, `PlanDetail`, …) live in `src/types/reading-plans.ts`.

- **List** (`plans/index.tsx`): guests get a `SignInPromptCard`; signed-in users get active + suggested sections. Tapping a card **body** (active or suggested) → plan detail; the suggested card's **"Começar" button** still starts inline.
- **Detail** (`plans/[planId]/`): serves both **preview** (not enrolled → days + "Começar") and **detail** (enrolled → day-by-day with completion checks + progress bar + "Remover plano" which archives). Reachable from the Plans tab and Home active-plan cards.
- **Progress model:** completions are the source of truth; `useMarkPlanDayComplete` upserts an idempotent completion (unique `(user_plan_id, day)`), recomputes `current_day` (lowest uncompleted), and flips `status`→`completed` when full. **One-way** (no un-marking). Two triggers, both calling the same mutation: a manual check on each detail day row (offline/paper fallback), and the Reader read-through CTA (primary — see Reader). Full design + the offline-migration plan: `.docs/plans-progress-tracking.md`.

### Reader

Reader tab under `src/app/(tabs)/reader/` (nested `Stack`). Renders verses for the current position from `useReaderStore` (`src/stores/reader.ts`: translation/book/chapter/fontSize, persisted). Bundled offline Bible via `src/hooks/use-bible.ts` / `src/services/bible.ts`.

- **Plan reading session:** opening a not-yet-done plan day from plan detail sets an ephemeral, in-memory `usePlanReadingStore` session (`src/stores/plan-reading.ts`: `userPlanId`, `day`, `bookId`, `lastChapter`, …) and navigates to the Reader. When the reader is at that session's last chapter, a **"Concluí esta leitura" footer CTA** (list footer, reachable only by scrolling through the passage) marks the day complete via `useMarkPlanDayComplete`, fires a celebration toast (day vs. whole-plan message + prayer nudge), and returns to detail. The session clears on completion or when the user manually picks different content via the book picker.
- **Verse highlighting (signed-in only):** each verse is wrapped in a `Pressable`; tapping opens the `VerseActionSheet` (6-color palette + remove). Tap is a **no-op for guests** (`handleVersePress` returns early when `!isAuthenticated`). The chapter's highlights are looked up via `useChapterHighlights(bookId, chapter)` (verse → color map) and rendered as a pastel background with fixed dark text (`#1A1A1A`) so they stay readable in every theme. See Study tools.

### Study tools (highlights)

Highlights are the first **study tool**, implemented **local-first and account-gated** (signed-in only). Architecture mirrors reading-progress (on-device now, sync later):

- **Types:** `src/types/study.ts` — `HighlightColor` (palette keys match `theme.highlights` / the `highlights` export in `src/theme/colors.ts`), the `Highlight` shape (verse reference is canonical identity; `translationId` records origin), and `highlightKey(userId, bookId, chapter, verse)`.
- **Store:** `src/stores/highlights.ts` (persisted Zustand, `byKey: Record<string, Highlight>`) keyed per **user+verse** so multiple accounts on one device never see each other's highlights. Persist name `nascente-highlights`.
- **Hooks:** `src/hooks/use-highlights.ts` — `useCurrentUserHighlights()` (filters `byKey` by the current `user.id`; empty for guests), `useChapterHighlights(bookId, chapter)`, `useHighlightActions(translationId)` (`setHighlight`/`removeHighlight` are no-ops without a user id). Because selectors filter by current user, **logout instantly shows nothing** — no cross-user leak.
- **Study tab** (`src/app/(tabs)/study/`, nested `Stack`): guests get a `SignInPromptCard` (icon `Highlighter`); signed-in users get the list of their highlights. `use-study-screen.ts` runs a React Query (`studyKeys.highlights`, `enabled: isAuthenticated`) that **enriches** each highlight with its book name + verse text from `@/services/bible` (fetched once per unique translation+book+chapter), sorted canonically. Tapping a highlight sets the reader position (translation + book/chapter) and navigates to the Reader. The query key is built from the highlight identities so it refetches on add/remove. Registered as the **4th bottom-nav tab** ("Estudo", between Planos and Ajustes) in `(tabs)/_layout.tsx`.
- **Sync later:** mirrors the DRAFT `highlights` table in `.docs/data-model.md`; a future account syncs the local store, same pattern as reading-progress / plans.

## Conventions

- ESLint config (`eslint.config.js`) is `eslint-config-expo` flat config + Prettier + `eslint-plugin-react-compiler` (recommended ruleset is enforced — write components compatible with the React Compiler, e.g. no manual memoization workarounds it would conflict with).
- Prettier: single quotes, semicolons, 120 print width, ES5 trailing commas, LF line endings (`.prettierrc`).
- Components/hooks/services follow named exports (no default exports except Expo Router screens, which require default export, and their co-located screen-private hooks — see "Route folders with co-located logic" above).
