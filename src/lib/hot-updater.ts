import { HotUpdater, insights } from '@hot-updater/react-native';
import { getPostHogClient } from '@/lib/posthog';

// OTA update client — Hot Updater backed by a dedicated Cloudflare Worker +
// D1 + private R2 (see .docs/ota-updates.md). `HotUpdater.init` runs once at
// module scope per the SDK contract: it performs the native launch-verification
// / automatic-rollback check for the previous boot and returns the singleton —
// it does NOT check for or download updates.
//
// The client API key is a publishable per-app credential sent as `x-api-key`;
// the same ship-in-bundle contract as the PostHog project key, so it lives
// under EXPO_PUBLIC_*. Cloudflare API/R2 tokens and the bundle-signing private
// key must NEVER appear here or in any EXPO_PUBLIC_* variable.
const baseURL = process.env.EXPO_PUBLIC_HOT_UPDATER_BASE_URL;
const clientApiKey = process.env.EXPO_PUBLIC_HOT_UPDATER_API_KEY;

function reportUpdateError(error: unknown) {
  // OTA failures must never surface to the user or break startup — warn and
  // report to PostHog so we can see check/download failures in the field.
  console.warn('[OTA]', error);
  try {
    getPostHogClient()?.capture('ota_error', {
      message: error instanceof Error ? error.message : String(error),
      bundle_id: hotUpdater?.getBundleId() ?? 'unknown',
    });
  } catch {
    // Analytics must never affect the update flow.
  }
}

// Missing envs disable OTA loudly-but-safely (dev machines, Expo Go, forks)
// rather than crashing the app — the offline reader must always boot.
export const hotUpdater =
  baseURL && clientApiKey
    ? HotUpdater.init({
        baseURL,
        requestHeaders: { 'x-api-key': clientApiKey },
        onError: reportUpdateError,
        // Matches the managed Worker's insights() server plugin — reports
        // launches/update outcomes so the Cloudflare side has telemetry.
        plugins: [insights()],
      })
    : undefined;

if (!hotUpdater) {
  console.warn('[OTA] Disabled — EXPO_PUBLIC_HOT_UPDATER_BASE_URL / _API_KEY not set.');
}

/**
 * Non-blocking background update check. Stages a compatible update for the
 * NEXT cold launch; only a server-marked force update reloads immediately.
 * Called after the app is fully ready — never on the startup critical path.
 */
export async function checkForAppUpdate(): Promise<void> {
  if (__DEV__ || !hotUpdater) return;

  try {
    const update = await hotUpdater.checkForUpdate({ updateStrategy: 'fingerprint' });
    const posthog = getPostHogClient();
    posthog?.capture('ota_check_completed', {
      update_available: update != null,
      bundle_id: hotUpdater.getBundleId(),
    });
    if (!update) return;

    const staged = await update.updateBundle();
    posthog?.capture(staged ? 'ota_update_staged' : 'ota_update_failed', {
      bundle_id: hotUpdater.getBundleId(),
      force_update: update.shouldForceUpdate,
    });
    if (staged && update.shouldForceUpdate) {
      await hotUpdater.reload();
    }
  } catch (error) {
    reportUpdateError(error);
  }
}
