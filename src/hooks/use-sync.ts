import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { useAuthStore } from '@/stores/auth';
import { useHighlightsStore } from '@/stores/highlights';
import { useBookmarksStore } from '@/stores/bookmarks';
import { useNotesStore } from '@/stores/notes';
import { useReadingProgressStore } from '@/stores/reading-progress';
import { useSyncMetaStore } from '@/services/sync/sync-meta';
import { syncAll } from '@/services/sync';

const DEBOUNCE_MS = 3000;

/**
 * Headless orchestrator for all local-first user-data sync — the three study
 * tools (highlights/bookmarks/notes) plus reading-progress. Mount once at the app
 * root. Self-gates: runs only when the relevant stores + auth are hydrated AND a
 * user is signed in, so guests pay zero cost. Triggers:
 *   1. sign-in / user-id change (also covers launch with an existing session)
 *   2. app foreground (AppState → active)
 *   3. reconnect (NetInfo isConnected false → true)
 *   4. a local mutation (study stores' byKey or reading-progress, debounced)
 * The engine's own in-flight guard + this debounce coalesce overlapping triggers.
 */
export function useSync(): void {
  const userId = useAuthStore((s) => s.user?.id) ?? null;
  const hlHydrated = useHighlightsStore((s) => s.hasHydrated);
  const bmHydrated = useBookmarksStore((s) => s.hasHydrated);
  const noteHydrated = useNotesStore((s) => s.hasHydrated);
  const progressHydrated = useReadingProgressStore((s) => s.hasHydrated);
  const metaHydrated = useSyncMetaStore((s) => s.hasHydrated);

  const ready = userId != null && hlHydrated && bmHydrated && noteHydrated && progressHydrated && metaHydrated;

  useEffect(() => {
    if (!ready || userId == null) return;

    let debounce: ReturnType<typeof setTimeout> | undefined;
    let wasConnected = true;

    const run = () => {
      void syncAll(userId);
    };
    const runDebounced = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(run, DEBOUNCE_MS);
    };

    // 1. Initial sync on becoming ready (sign-in / launch with a session).
    run();

    // 2. App foreground.
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') runDebounced();
    });

    // 3. Reconnect (only on the false → true edge).
    const netSub = NetInfo.addEventListener((state) => {
      const connected = state.isConnected === true;
      if (connected && !wasConnected) runDebounced();
      wasConnected = connected;
    });

    // 4. Local mutations. The study stores don't use the subscribeWithSelector
    // middleware, so compare the slice identity ourselves (changes only on a
    // mutation, not on the hydration flag flip).
    const onByKeyChange = (next: { byKey: unknown }, prev: { byKey: unknown }) => {
      if (next.byKey !== prev.byKey) runDebounced();
    };
    const onProgressChange = (
      next: { readChapters: unknown; readDays: unknown },
      prev: { readChapters: unknown; readDays: unknown }
    ) => {
      if (next.readChapters !== prev.readChapters || next.readDays !== prev.readDays) runDebounced();
    };
    const storeSubs = [
      useHighlightsStore.subscribe(onByKeyChange),
      useBookmarksStore.subscribe(onByKeyChange),
      useNotesStore.subscribe(onByKeyChange),
      useReadingProgressStore.subscribe(onProgressChange),
    ];

    return () => {
      if (debounce) clearTimeout(debounce);
      appStateSub.remove();
      netSub();
      for (const unsub of storeSubs) unsub();
    };
  }, [ready, userId]);
}

/**
 * Pull cross-device changes when a screen gains focus. The global `useSync`
 * triggers (foreground / reconnect / local edit) don't fire on an in-app tab
 * switch, so a device that's only *viewing* wouldn't pick up another device's
 * edits until it backgrounded. Mount this on the surfaces that render synced
 * data (Study tab, Reader, Home) so navigating to them re-pulls. Pulled rows
 * land in the Zustand stores, which the screens already read reactively. No-op
 * for guests; the engine's in-flight guard dedupes overlap with the global triggers.
 */
export function useSyncOnFocus(): void {
  const userId = useAuthStore((s) => s.user?.id) ?? null;

  useFocusEffect(
    useCallback(() => {
      if (userId != null) void syncAll(userId);
    }, [userId])
  );
}
