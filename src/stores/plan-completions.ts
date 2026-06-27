import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { planCompletionKey, type LocalPlanCompletion } from '@/types/reading-plans';

/**
 * Local-first, append-only log of completed plan days (the source of truth for
 * plan progress). Mirrors `src/stores/reading-progress.ts`: a day once completed
 * is never edited or removed, so there are no tombstones / LWW / dirty flags —
 * sync pushes the whole local set with `on conflict do nothing` and pulls via
 * union (`mergeRemote`). Keyed per user+enrollment+day so accounts on one device
 * never collide; `current_day`/`status`/`progress` are derived from this set (see
 * `src/stores/plan-enrollments.ts`). Synced by `src/services/sync/reading-plans.ts`.
 */
type PlanCompletionsState = {
  byKey: Record<string, LocalPlanCompletion>;
  hasHydrated: boolean;
  /** Idempotent mark-complete (no-op if already recorded). */
  add: (userId: string, userPlanId: string, day: number) => void;
  /** Union pulled remote completions in (never removes). */
  mergeRemote: (userId: string, rows: { userPlanId: string; day: number; completedAt: string }[]) => void;
  setHasHydrated: (value: boolean) => void;
};

export const usePlanCompletionsStore = create<PlanCompletionsState>()(
  persist(
    (set, get) => ({
      byKey: {},
      hasHydrated: false,
      add: (userId, userPlanId, day) =>
        set((state) => {
          const key = planCompletionKey(userId, userPlanId, day);
          if (state.byKey[key]) return state; // idempotent
          const row: LocalPlanCompletion = { userId, userPlanId, day, completedAt: new Date().toISOString() };
          return { byKey: { ...state.byKey, [key]: row } };
        }),
      mergeRemote: (userId, rows) => {
        const { byKey } = get();
        let next = byKey;
        let changed = false;
        for (const r of rows) {
          const key = planCompletionKey(userId, r.userPlanId, r.day);
          if (next[key]) continue;
          if (!changed) next = { ...next };
          next[key] = { userId, userPlanId: r.userPlanId, day: r.day, completedAt: r.completedAt };
          changed = true;
        }
        if (!changed) return; // nothing new → no re-render
        set({ byKey: next });
      },
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'nascente-plan-completions',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ byKey }) => ({ byKey }),
      onRehydrateStorage: () => (state, error) => {
        if (!error) state?.setHasHydrated(true);
      },
    }
  )
);

/** Set of completed day numbers for one enrollment (filters by current user). */
export function completedDaysFor(
  byKey: Record<string, LocalPlanCompletion>,
  userId: string,
  userPlanId: string
): Set<number> {
  const days = new Set<number>();
  for (const row of Object.values(byKey)) {
    if (row.userId === userId && row.userPlanId === userPlanId) days.add(row.day);
  }
  return days;
}
