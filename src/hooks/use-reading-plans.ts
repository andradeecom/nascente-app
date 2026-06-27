import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';
import { profileKeys } from '@/hooks/use-profile';
import { syncAll } from '@/services/sync';
import { usePlanCatalogStore, getCuratedPlans } from '@/stores/plan-catalog';
import {
  usePlanEnrollmentsStore,
  deriveCurrentDay,
  deriveProgressPercent,
  deriveStatus,
} from '@/stores/plan-enrollments';
import { usePlanCompletionsStore, completedDaysFor } from '@/stores/plan-completions';
import { ACTIVE_PLAN_LIMIT, PlanLimitError } from '@/types/subscription';
import type { AccountTier } from '@/types/subscription';
import { enrollmentKey } from '@/types/reading-plans';
import type {
  ActiveReadingPlan,
  LocalEnrollment,
  PlanDayGroup,
  PlanDetail,
  ReadingPlan,
  ReadingPlanDay,
  SuggestedReadingPlan,
  UserPlanStatus,
  UserReadingPlan,
} from '@/types/reading-plans';

export const planKeys = {
  all: ['plans'] as const,
  active: ['plans', 'active'] as const,
  suggested: ['plans', 'suggested'] as const,
  detail: (planId: string) => ['plans', 'detail', planId] as const,
};

/**
 * Reading plans are **offline-first**: the local Zustand stores (catalog,
 * enrollments, completions) are the source of truth, synced to Supabase by
 * `src/services/sync/reading-plans.ts`. These hooks keep their React Query
 * surface (so screens, `.isPending`/`.mutate`/`useRefetchOnFocus` are unchanged),
 * but read/write the stores synchronously instead of the network — reads work
 * offline, writes apply instantly + mark the row dirty + fire a background sync.
 * `current_day`/`status`/`progress` are always **derived** from the completion
 * set (see `.docs/plans-progress-tracking.md` §2).
 */

// ── Local read helpers ───────────────────────────────────────────────────────

/** Map a local enrollment + derived fields into the `UserReadingPlan` shape the UI expects. */
function toUserReadingPlan(
  e: LocalEnrollment,
  currentDay: number,
  status: UserPlanStatus,
  completedAt: string | null
): UserReadingPlan {
  return {
    id: e.id,
    user_id: e.userId,
    plan_id: e.planId,
    status,
    current_day: currentDay,
    started_at: e.startedAt,
    completed_at: completedAt,
    created_at: e.createdAt,
    updated_at: e.updatedAt,
  };
}

/** Lead reading (sort_order 0) label at a given day, looked up in the cached catalog. */
function nextReadingLabel(days: ReadingPlanDay[] | undefined, day: number): string | null {
  if (!days) return null;
  const lead = days.find((d) => d.day === day && d.sort_order === 0);
  return lead?.ref_label ?? null;
}

/** The user's single enrollment for a plan (one row per user+plan), or undefined. */
function enrollmentFor(userId: string, planId: string): LocalEnrollment | undefined {
  return usePlanEnrollmentsStore.getState().byKey[enrollmentKey(userId, planId)];
}

// ── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Plans the user has started and not archived, joined with their catalog plan,
 * with progress % and the next reading label derived for the "Planos ativos" list.
 */
export function useActivePlans() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: planKeys.active,
    enabled: isAuthenticated && !!userId,
    queryFn: async (): Promise<ActiveReadingPlan[]> => {
      const uid = userId as string;
      const { plans, daysByPlan } = usePlanCatalogStore.getState();
      const completionsByKey = usePlanCompletionsStore.getState().byKey;

      return Object.values(usePlanEnrollmentsStore.getState().byKey)
        .filter((e) => e.userId === uid)
        .flatMap((e): ActiveReadingPlan[] => {
          const plan = plans[e.planId];
          if (!plan) return []; // catalog not cached yet (e.g. never online)
          const done = completedDaysFor(completionsByKey, uid, e.id);
          const status = deriveStatus(e, done.size, plan.total_days);
          if (status !== 'active') return [];

          const currentDay = deriveCurrentDay(done, plan.total_days);
          return [
            {
              userPlan: toUserReadingPlan(e, currentDay, 'active', null),
              plan,
              progressPercent: deriveProgressPercent(done.size, plan.total_days),
              nextReadingLabel: nextReadingLabel(daysByPlan[e.planId], currentDay),
            },
          ];
        })
        .sort((a, b) => b.userPlan.started_at.localeCompare(a.userPlan.started_at));
    },
    staleTime: 1000 * 60, // 1 min; active plans change more often than suggested
  });
}

/**
 * Curated/public plans the user hasn't started yet — the "Sugeridos" list.
 */
export function useSuggestedPlans() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: planKeys.suggested,
    enabled: isAuthenticated && !!userId,
    queryFn: async (): Promise<SuggestedReadingPlan[]> => {
      const uid = userId as string;
      const { plans } = usePlanCatalogStore.getState();
      const enrollments = usePlanEnrollmentsStore.getState().byKey;

      // Exclude plans with a non-archived enrollment (archived returns to Sugeridos).
      return getCuratedPlans(plans).filter((p) => {
        const e = enrollments[enrollmentKey(uid, p.id)];
        return !e || e.status === 'archived';
      });
    },
    staleTime: 1000 * 60 * 5, // 5 min; suggested plans don't change often
  });
}

/**
 * Enroll the current user in a plan ("Começar") — local-first/offline. Applies
 * instantly to the store and triggers a background sync; the DB active-plan-cap
 * trigger stays the server backstop.
 */
export function useStartPlan() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (plan: ReadingPlan): Promise<UserReadingPlan> => {
      if (!user) throw new Error('Not authenticated');

      // Tier-aware active-plan cap, checked against the LOCAL active count (no
      // network). Tier from cache (defaults to free); the DB trigger backstops.
      const tier = queryClient.getQueryData<{ tier: AccountTier }>(profileKeys.me)?.tier ?? 'free';
      const limit = ACTIVE_PLAN_LIMIT[tier];

      const { plans } = usePlanCatalogStore.getState();
      const completionsByKey = usePlanCompletionsStore.getState().byKey;
      const activeCount = Object.values(usePlanEnrollmentsStore.getState().byKey).filter((e) => {
        if (e.userId !== user.id || e.planId === plan.id) return false; // exclude the one being (re)started
        const total = plans[e.planId]?.total_days ?? 0;
        return deriveStatus(e, completedDaysFor(completionsByKey, user.id, e.id).size, total) === 'active';
      }).length;
      if (activeCount >= limit) throw new PlanLimitError(limit);

      const row = usePlanEnrollmentsStore.getState().start(user.id, plan.id);
      void syncAll(user.id);
      return toUserReadingPlan(row, 1, 'active', null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.active });
      queryClient.invalidateQueries({ queryKey: planKeys.suggested });
    },
  });
}

/**
 * Plan detail: the catalog plan + its grouped days + the user's enrollment (and
 * which days they've completed). Serves both modes — enrollment null = preview.
 */
export function usePlanDetail(planId: string | undefined) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: planKeys.detail(planId ?? ''),
    enabled: isAuthenticated && !!planId && !!userId,
    queryFn: async (): Promise<PlanDetail> => {
      const id = planId as string;
      const uid = userId as string;
      const { plans, daysByPlan } = usePlanCatalogStore.getState();
      const plan = plans[id];
      if (!plan) throw new Error('Plan not found in catalog');

      const local = enrollmentFor(uid, id);
      const enrollment = local && local.status !== 'archived' ? local : undefined;

      const done = enrollment
        ? completedDaysFor(usePlanCompletionsStore.getState().byKey, uid, enrollment.id)
        : new Set<number>();

      const enrollmentVm = enrollment
        ? toUserReadingPlan(
            enrollment,
            deriveCurrentDay(done, plan.total_days),
            deriveStatus(enrollment, done.size, plan.total_days),
            null
          )
        : null;

      return {
        plan,
        days: groupPlanDays(daysByPlan[id] ?? [], done),
        enrollment: enrollmentVm,
      };
    },
    staleTime: 1000 * 60,
  });
}

/**
 * Mark a plan day complete — local-first/offline, idempotent. Records the
 * completion (the source of truth), flips the enrollment to `completed` once
 * every day is logged, and triggers a background sync. `current_day`/`status`
 * stay derived (see `.docs/plans-progress-tracking.md` §2).
 */
export function useMarkPlanDayComplete() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (vars: {
      userPlanId: string;
      planId: string;
      day: number;
      totalDays: number;
    }): Promise<{ finished: boolean }> => {
      if (!user) throw new Error('Not authenticated');

      usePlanCompletionsStore.getState().add(user.id, vars.userPlanId, vars.day);

      const done = completedDaysFor(usePlanCompletionsStore.getState().byKey, user.id, vars.userPlanId);
      const finished = done.size >= vars.totalDays;
      if (finished) usePlanEnrollmentsStore.getState().markComplete(user.id, vars.planId);

      void syncAll(user.id);
      return { finished };
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: planKeys.active });
      queryClient.invalidateQueries({ queryKey: planKeys.detail(vars.planId) });
    },
  });
}

/**
 * Remove an active plan ("Remover plano") by archiving it (local-first), so it
 * drops out of the active list and frees a slot in Sugeridos. The archive syncs
 * as a sticky status (§6.2), propagating the removal to other devices.
 */
export function useArchivePlan() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (vars: { userPlanId: string; planId: string }) => {
      if (!user) throw new Error('Not authenticated');
      usePlanEnrollmentsStore.getState().archive(user.id, vars.planId);
      void syncAll(user.id);
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: planKeys.active });
      queryClient.invalidateQueries({ queryKey: planKeys.suggested });
      queryClient.invalidateQueries({ queryKey: planKeys.detail(vars.planId) });
    },
  });
}

/** Group flat reading_plan_days rows by day, joining labels and marking done. */
function groupPlanDays(rows: ReadingPlanDay[], completed: Set<number>): PlanDayGroup[] {
  const byDay = new Map<number, ReadingPlanDay[]>();
  for (const row of rows) {
    const list = byDay.get(row.day) ?? [];
    list.push(row);
    byDay.set(row.day, list);
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => a - b)
    .map(([day, readings]) => {
      const sorted = [...readings].sort((a, b) => a.sort_order - b.sort_order);
      const lead = sorted[0];
      return {
        day,
        label: sorted.map((r) => r.ref_label).join(' · '),
        bookId: lead?.book_id ?? null,
        chapter: lead?.chapter_start ?? null,
        chapterEnd: lead?.chapter_end ?? lead?.chapter_start ?? null,
        completed: completed.has(day),
      };
    });
}
