import { useEffect } from 'react';
import { checkForAppUpdate } from '@/lib/hot-updater';

/**
 * Runs a non-blocking OTA check once the app is fully ready (post-hydration,
 * post-animated-splash). Headless and self-gating: no-ops in __DEV__ and when
 * the Hot Updater envs are absent, so it can never delay or break startup.
 */
export function useOtaUpdate(ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    void checkForAppUpdate();
  }, [ready]);
}
