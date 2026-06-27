import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ReadingPlan, ReadingPlanDay } from '@/types/reading-plans';

/**
 * Device-global cache of the curated reading-plan catalog (`reading_plans` +
 * `reading_plan_days` where `owner_id is null`). Pulled once (and refreshed when
 * online) by `src/services/sync/reading-plans.ts`; thereafter the Plans screens
 * read it locally so browsing works offline. The catalog is the same for every
 * user, so this store is **device-global** (not per-user) and is **not** cleared
 * on logout. A guest who has never been online sees an empty catalog — acceptable,
 * since starting/tracking plans needs an account anyway.
 */
type PlanCatalogState = {
  plans: Record<string, ReadingPlan>;
  daysByPlan: Record<string, ReadingPlanDay[]>;
  hasHydrated: boolean;
  /** One-way server→local replace of the whole curated catalog. */
  replaceCatalog: (plans: ReadingPlan[], days: ReadingPlanDay[]) => void;
  setHasHydrated: (value: boolean) => void;
};

export const usePlanCatalogStore = create<PlanCatalogState>()(
  persist(
    (set) => ({
      plans: {},
      daysByPlan: {},
      hasHydrated: false,
      replaceCatalog: (plans, days) => {
        const plansById: Record<string, ReadingPlan> = {};
        for (const plan of plans) plansById[plan.id] = plan;
        const daysByPlan: Record<string, ReadingPlanDay[]> = {};
        for (const day of days) {
          (daysByPlan[day.plan_id] ??= []).push(day);
        }
        set({ plans: plansById, daysByPlan });
      },
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

/** Curated plans sorted by creation order (matches the server `order('created_at')`). */
export function getCuratedPlans(plans: Record<string, ReadingPlan>): ReadingPlan[] {
  return Object.values(plans).sort((a, b) => a.created_at.localeCompare(b.created_at));
}
