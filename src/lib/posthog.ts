import PostHog from 'posthog-react-native';
import type { LogAttributes } from 'posthog-react-native';
import type { AnalyticsEvent, AnalyticsEventMap, AnalyticsSuperProperties } from '@/types/analytics';

/**
 * PostHog's property bag type. Derived from the SDK's own `screen()` signature
 * rather than imported from `@posthog/core` — that package is a transitive
 * dependency, and under pnpm's strict linking a direct import of it would break
 * the moment the SDK bumps its core version.
 */
type EventProperties = NonNullable<Parameters<PostHog['screen']>[1]>;

/**
 * Single PostHog entry point — the SDK wrapped in a thin seam, the same way
 * `src/lib/revenuecat.ts` wraps `Purchases` and `src/lib/supabase.ts` is the one
 * Supabase client. Nothing outside this file imports `posthog-react-native`, so
 * the "is it configured?" guard, the event typing, and the privacy rules live in
 * one place.
 *
 * When `EXPO_PUBLIC_POSTHOG_API_KEY` is absent (a fresh clone, CI, or a build
 * before the key is wired) every function here no-ops and `client` stays null —
 * the app boots and behaves identically, just without analytics. Same
 * boot-safety contract as `configureRevenueCat()`.
 *
 * **Why a module singleton and not just `PostHogProvider`'s client:** most
 * instrumentation sites are non-component code — Zustand stores (`stores/auth.ts`),
 * React Query mutations, service functions — where the `usePostHog()` hook can't
 * be called. The provider is handed *this* instance via its `client` prop, so the
 * hook and this singleton are the same object.
 */

const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
// Region-specific ingestion host. EU Cloud for pt/es data residency — PostHog
// has no "host" field in project settings; it's derived from the project Region.
const host = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com';

let client: PostHog | null = null;

/** Whether the SDK has a key and has been configured (false without a key). */
export function isPostHogConfigured(): boolean {
  return client !== null;
}

/** The raw client, for the `PostHogProvider` `client` prop. Null without a key. */
export function getPostHogClient(): PostHog | null {
  return client;
}

/**
 * Configure the SDK once at app start, before any capture call. Safe to call
 * without a key — it just no-ops so the app boots without analytics.
 *
 * User identity is intentionally NOT bound here; it's bound to the Supabase user
 * from the auth lifecycle via `syncPostHogIdentity` (see `src/stores/auth.ts`),
 * exactly like RevenueCat.
 */
export function configurePostHog(): void {
  if (client || !apiKey) return;

  client = new PostHog(apiKey, {
    host,
    // Application Installed / Updated / Opened / Became Active / Backgrounded.
    captureAppLifecycleEvents: true,

    // Session replay. Masking defaults to on for text inputs and images; we keep
    // those defaults and additionally wrap specific surfaces in `PostHogMaskView`
    // (note editor, auth forms) since scripture study is personal content.
    enableSessionReplay: true,
    sessionReplayConfig: {
      maskAllTextInputs: true,
      maskAllImages: true,
      maskAllSandboxedViews: true,
      // Screenshot cadence. 1s is the SDK default; lower means more snapshots and
      // more battery/bandwidth, which matters for an offline-first reading app.
      throttleDelayMs: 1000,
      captureLog: false,
      captureNetworkTelemetry: false,
    },

    errorTracking: {
      autocapture: {
        uncaughtExceptions: true,
        unhandledRejections: true,
        // console.error is noisy in RN (dev warnings, third-party libs) and would
        // drown the real exceptions.
        console: false,
        // Native iOS/Android crash capture, via @posthog/react-native-plugin.
        // Requires a native rebuild — not available in Expo Go.
        nativeCrashes: true,
      },
    },

    logs: {
      serviceName: 'nascente-app',
      environment: __DEV__ ? 'development' : 'production',
    },

    // Keep local development out of production analytics. Flip this to false
    // temporarily when verifying the integration against PostHog's live feed.
    disabled: __DEV__,
  });
}

/**
 * Capture a named product event. Typed against `AnalyticsEventMap`, so both the
 * event name and its properties are compile-checked.
 *
 * Never pass user-authored or scripture text (note bodies, search queries, verse
 * text, emails, names) — send lengths/counts/ids instead. See `types/analytics.ts`.
 */
export function capture<E extends AnalyticsEvent>(
  event: E,
  ...[properties]: AnalyticsEventMap[E] extends Record<string, never> ? [] : [AnalyticsEventMap[E]]
): void {
  client?.capture(event, properties);
}

/**
 * Record a screen view. Driven by `usePathname()` in `use-analytics.ts` rather
 * than per-screen mount effects — see that file for why that distinction matters
 * with NativeTabs.
 */
export function screen(name: string, properties?: EventProperties): void {
  client?.screen(name, properties);
}

/**
 * Bind analytics to the signed-in Supabase user. `userId` is `auth.users.id` —
 * the same id RevenueCat uses as `app_user_id` and the Edge Functions use as the
 * `$ai_generation` distinct id, so client events, revenue and AI cost all join to
 * one person.
 *
 * Call via `syncPostHogIdentity` (src/stores/auth.ts), never directly — that
 * helper's synchronous guard is what keeps `onAuthStateChange` token refreshes
 * from re-identifying on every fire.
 */
export function identifyUser(userId: string): void {
  client?.identify(userId);
}

/**
 * Reset to an anonymous id on sign-out, so the next user on a shared device
 * doesn't inherit the previous person's identity.
 */
export function resetIdentity(): void {
  client?.reset();
}

/** Register the global properties attached to every subsequent event. */
export function registerSuperProperties(properties: AnalyticsSuperProperties): void {
  client?.register(properties);
}

/**
 * Report a handled error. Used at known failure points that would otherwise be
 * silent — the sync engine, the Bible DB open path, auth deep links. Unhandled
 * exceptions are captured automatically via `errorTracking.autocapture`.
 */
export function captureError(error: unknown, properties?: EventProperties): void {
  client?.captureException(error, properties);
}

/**
 * Structured logging for headless diagnostics (sync failures, DB open races) —
 * things that today are `console.error`s nobody can aggregate across devices.
 *
 * Deliberately NOT a general console replacement: capture is unconditional once
 * called, and mobile defaults cap around ~50 logs/sec. Keep it to real diagnostics.
 */
export const log = {
  info(message: string, attributes?: LogAttributes): void {
    client?.logger.info(message, attributes);
  },
  warn(message: string, attributes?: LogAttributes): void {
    client?.logger.warn(message, attributes);
  },
  error(message: string, attributes?: LogAttributes): void {
    client?.logger.error(message, attributes);
  },
};
