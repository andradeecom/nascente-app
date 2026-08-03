/**
 * Setup for the `node` (pure-function) project.
 *
 * These tests import real modules — no React Native runtime is loaded. The only
 * stubs here are for leaf modules that transitively drag RN in through a barrel
 * file. `src/schemas/*` imports `translate` from `@/i18n`, whose `index.ts` also
 * re-exports `use-translate.ts` → `@/stores/locale` → AsyncStorage → RN. The
 * schemas only need `translate`, so we stub the hook module rather than mock
 * i18n itself: validation messages stay the real translated strings, which is
 * what the schema tests assert against.
 */
jest.mock('@/i18n/use-translate', () => ({
  useTranslate: () => (key: string) => key,
}));

/** `@/lib/posthog` is imported by services under test purely for instrumentation. */
jest.mock('@/lib/posthog', () => ({
  capture: jest.fn(),
  captureError: jest.fn(),
  identifyUser: jest.fn(),
  resetIdentity: jest.fn(),
  screen: jest.fn(),
  registerSuperProperties: jest.fn(),
  isPostHogConfigured: () => false,
  getPostHogClient: () => null,
  log: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
