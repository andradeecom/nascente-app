# Nascente

A premium, offline-first Bible reading experience for Portuguese and Spanish speakers, with AI-powered study tools (explain, chapter summary, devotionals, prayer prompts, AI-generated reading plans) layered into the reader.

Three public-domain translations ship bundled in SQLite for zero-network reading; Pro unlocks additional translations, reading plans, highlights/notes/bookmarks, and the AI study layer.

## Tech stack

- **App:** [Expo](https://expo.dev) / React Native / TypeScript, file-based routing via `expo-router`
- **Styling:** [react-native-unistyles](https://www.unistyles.dev)
- **Backend:** [Supabase](https://supabase.com) (Postgres, Auth, RLS, Storage, Edge Functions)
- **Data fetching:** TanStack Query
- **Billing:** RevenueCat
- **Analytics:** PostHog
- **Package manager:** pnpm

## Getting started

Requires Node `>= 24.17.0` (pinned in `.nvmrc`) and pnpm `11.18.0` (pinned via `packageManager` in `package.json`).

```bash
pnpm install
cp .env.example .env.local   # fill in Supabase / RevenueCat / PostHog keys
pnpm start                   # expo start (dev server)
```

Several features (Supabase auth, Google/Apple sign-in, RevenueCat, native tabs, the keyboard controller) are native modules and require a dev/standalone build rather than Expo Go:

```bash
pnpm ios       # expo run:ios
pnpm android   # expo run:android
```

Husky + lint-staged run Prettier and `expo lint --fix` on staged files at commit time.

## Project structure

```
src/
  app/          # expo-router routes (file-based)
  components/   # atoms / molecules / organisms (atomic design)
  hooks/        # shared React hooks
  services/     # Bible data access, sync engine
  stores/       # Zustand stores (local-first state)
  theme/        # design tokens (react-native-unistyles)
  i18n/         # pt / es / en translations
supabase/
  functions/    # Edge Functions (AI generation, auth emails, RevenueCat webhook)
```

## Contributing

To contribute, fork the repo, create a feature branch, and open a pull request against `main`. Direct pushes to `main` are disabled, so all changes (including from maintainers) go through PR review and must pass CI (typecheck, lint, tests) before merging. Please run `pnpm typecheck && pnpm lint && pnpm test` locally before opening a PR.

## License

[MIT](LICENSE.md)
