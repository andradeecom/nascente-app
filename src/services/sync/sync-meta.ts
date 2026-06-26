import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Incremental-pull cursor for the study-tools sync engine: the last server
 * `updated_at` we've merged, per collection per user. Keyed `${collection}:${userId}`
 * so two accounts on one device keep independent cursors. Read non-reactively
 * from the engine via `getState()`. `clearForUser` is called on logout so a
 * re-login does a clean full re-pull.
 */
type SyncMetaState = {
  lastPulledAt: Record<string, string>;
  hasHydrated: boolean;
  getLastPulledAt: (name: string, userId: string) => string | undefined;
  setLastPulledAt: (name: string, userId: string, iso: string) => void;
  clearForUser: (userId: string) => void;
  setHasHydrated: (value: boolean) => void;
};

const metaKey = (name: string, userId: string) => `${name}:${userId}`;

export const useSyncMetaStore = create<SyncMetaState>()(
  persist(
    (set, get) => ({
      lastPulledAt: {},
      hasHydrated: false,
      getLastPulledAt: (name, userId) => get().lastPulledAt[metaKey(name, userId)],
      setLastPulledAt: (name, userId, iso) =>
        set((state) => ({ lastPulledAt: { ...state.lastPulledAt, [metaKey(name, userId)]: iso } })),
      clearForUser: (userId) =>
        set((state) => {
          const suffix = `:${userId}`;
          const next: Record<string, string> = {};
          for (const [key, value] of Object.entries(state.lastPulledAt)) {
            if (!key.endsWith(suffix)) next[key] = value;
          }
          return { lastPulledAt: next };
        }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'nascente-sync-meta',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ lastPulledAt }) => ({ lastPulledAt }),
      onRehydrateStorage: () => (state, error) => {
        if (!error) state?.setHasHydrated(true);
      },
    }
  )
);
