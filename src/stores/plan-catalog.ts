import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ReadingPlan, ReadingPlanDay } from '@/types/reading-plans';

/**
 * Device-global cache of the reading-plan catalog (`reading_plans` +
 * `reading_plan_days`). Holds two kinds of plan:
 *  - **curated** (`owner_id === null`) — the same for every user, pulled by
 *    `src/services/sync/reading-plans.ts` (`syncPlanCatalog`), the "Sugeridos" list.
 *  - **own** (`owner_id === <uid>`) — the user's private AI-generated plans, added
 *    locally by `addOwnPlan` on generation and re-pulled on sync so they survive a
 *    reinstall. These are auto-enrolled, so they surface in "Planos ativos", never
 *    "Sugeridos" (see `getCuratedPlans`).
 *
 * The store is **device-global** (not per-user) and is **not** cleared on logout;
 * own-plan rows are RLS-scoped server-side and simply won't re-pull for a different
 * user. A guest who has never been online sees an empty catalog — acceptable, since
 * starting/tracking plans needs an account anyway.
 */
type PlanCatalogState = {
  plans: Record<string, ReadingPlan>;
  daysByPlan: Record<string, ReadingPlanDay[]>;
  hasHydrated: boolean;
  /**
   * Server→local replace of the catalog. Curated plans (owner_id null) are fully
   * replaced by what's passed; **own-plans (owner_id set) are preserved** unless
   * they appear in the incoming set — so a curated-only pull never wipes the
   * user's private AI plans. Pass own-plans too (from the own-plans pull) to
   * refresh them.
   */
  replaceCatalog: (plans: ReadingPlan[], days: ReadingPlanDay[]) => void;
  /** Add/replace a single (own) plan + its days locally — used right after AI generation. */
  addOwnPlan: (plan: ReadingPlan, days: ReadingPlanDay[]) => void;
  setHasHydrated: (value: boolean) => void;
};

export const usePlanCatalogStore = create<PlanCatalogState>()(
  persist(
    (set) => ({
      plans: {},
      daysByPlan: {},
      hasHydrated: false,
      replaceCatalog: (plans, days) =>
        set((state) => {
          // Preserve existing own-plans (owner_id set) that aren't in the incoming
          // set, so a curated-only pull doesn't clobber the user's private plans.
          const incomingIds = new Set(plans.map((p) => p.id));
          const plansById: Record<string, ReadingPlan> = {};
          const daysByPlan: Record<string, ReadingPlanDay[]> = {};
          for (const [id, plan] of Object.entries(state.plans)) {
            if (plan.owner_id !== null && !incomingIds.has(id)) {
              plansById[id] = plan;
              if (state.daysByPlan[id]) daysByPlan[id] = state.daysByPlan[id];
            }
          }
          for (const plan of plans) plansById[plan.id] = plan;
          for (const day of days) (daysByPlan[day.plan_id] ??= []).push(day);
          return { plans: plansById, daysByPlan };
        }),
      addOwnPlan: (plan, days) =>
        set((state) => ({
          plans: { ...state.plans, [plan.id]: plan },
          daysByPlan: { ...state.daysByPlan, [plan.id]: [...days].sort((a, b) => a.day - b.day) },
        })),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'nascente-plan-catalog',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ plans, daysByPlan }) => ({ plans, daysByPlan }),
      onRehydrateStorage: () => (state, error) => {
        if (!error) state?.setHasHydrated(true);
      },
    }
  )
);

/**
 * Curated (public) plans only, sorted by creation order (matches the server
 * `order('created_at')`). Excludes own AI-generated plans (owner_id set) — those
 * are private + auto-enrolled, so they belong in "Planos ativos", not "Sugeridos".
 */
export function getCuratedPlans(plans: Record<string, ReadingPlan>): ReadingPlan[] {
  return Object.values(plans)
    .filter((p) => p.owner_id === null)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}
