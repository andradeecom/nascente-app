import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import type {
  ActiveReadingPlan,
  PlanDayGroup,
  PlanDetail,
  ReadingPlan,
  ReadingPlanDay,
  SuggestedReadingPlan,
} from '@/types/reading-plans';

export const planKeys = {
  all: ['plans'] as const,
  active: ['plans', 'active'] as const,
  suggested: ['plans', 'suggested'] as const,
  detail: (planId: string) => ['plans', 'detail', planId] as const,
};

/**
 * Plans the user has started and not archived, joined with their catalog plan,
 * with progress % and the next reading label derived for the "Planos ativos" list.
 */
export function useActivePlans() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: planKeys.active,
    enabled: isAuthenticated,
    queryFn: async (): Promise<ActiveReadingPlan[]> => {
      const { data, error } = await supabase
        .from('user_reading_plans')
        .select(
          `*,
           plan:reading_plans!inner (*),
           completions:user_reading_plan_completions (day)`
        )
        .eq('status', 'active')
        .order('started_at', { ascending: false });

      if (error) throw error;

      const userPlans = data ?? [];

      // Fetch the next reading label for each plan in one query, then index by plan.
      const nextLabels = await fetchNextReadingLabels(
        userPlans.map((up) => ({ planId: up.plan.id, day: up.current_day }))
      );

      return userPlans.map((up) => {
        const { plan, completions, ...userPlan } = up;
        const completedCount = completions?.length ?? 0;
        const progressPercent = plan.total_days > 0 ? Math.round((completedCount / plan.total_days) * 100) : 0;

        return {
          userPlan,
          plan,
          progressPercent,
          nextReadingLabel: nextLabels.get(`${plan.id}:${up.current_day}`) ?? null,
        };
      });
    },
    staleTime: 1000 * 60, // 1 min; active plans change more often than suggested
  });
}

/**
 * Curated/public plans the user hasn't started yet — the "Sugeridos" list.
 */
export function useSuggestedPlans() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: planKeys.suggested,
    enabled: isAuthenticated,
    queryFn: async (): Promise<SuggestedReadingPlan[]> => {
      // Public catalog (RLS already limits to owner_id null + own); curated plans
      // expose a slug, so filter on that to keep the suggested list to the catalog.
      const { data: plans, error } = await supabase
        .from('reading_plans')
        .select('*')
        .is('owner_id', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const { data: started, error: startedError } = await supabase.from('user_reading_plans').select('plan_id');

      if (startedError) throw startedError;

      const startedIds = new Set((started ?? []).map((s) => s.plan_id));
      return (plans ?? []).filter((p) => !startedIds.has(p.id));
    },
    staleTime: 1000 * 60 * 5, // 5 min; suggested plans don't change often
  });
}

/**
 * Enroll the current user in a plan ("Começar"). Refreshes both lists so the
 * plan moves from Sugeridos to Ativos.
 */
export function useStartPlan() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (plan: ReadingPlan) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_reading_plans')
        .insert({ user_id: user.id, plan_id: plan.id })
        .select()
        .single();

      if (error) throw error;
      return data;
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

  return useQuery({
    queryKey: planKeys.detail(planId ?? ''),
    enabled: isAuthenticated && !!planId,
    queryFn: async (): Promise<PlanDetail> => {
      const id = planId as string;

      const [planRes, daysRes, enrollRes] = await Promise.all([
        supabase.from('reading_plans').select('*').eq('id', id).single(),
        supabase.from('reading_plan_days').select('*').eq('plan_id', id).order('day').order('sort_order'),
        // Most recent non-archived enrollment for this plan, if any.
        supabase
          .from('user_reading_plans')
          .select('*')
          .eq('plan_id', id)
          .neq('status', 'archived')
          .order('started_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (planRes.error) throw planRes.error;
      if (daysRes.error) throw daysRes.error;
      if (enrollRes.error) throw enrollRes.error;

      const enrollment = enrollRes.data ?? null;

      let completedDays = new Set<number>();
      if (enrollment) {
        const { data: comps, error } = await supabase
          .from('user_reading_plan_completions')
          .select('day')
          .eq('user_plan_id', enrollment.id);
        if (error) throw error;
        completedDays = new Set((comps ?? []).map((c) => c.day));
      }

      return {
        plan: planRes.data,
        days: groupPlanDays(daysRes.data ?? [], completedDays),
        enrollment,
      };
    },
    staleTime: 1000 * 60,
  });
}

/**
 * Mark a plan day complete (online, idempotent). Upserts the completion, then
 * recomputes the enrollment's `current_day` (lowest uncompleted day) and flips
 * status → completed once every day is logged. Completions are the source of
 * truth; current_day/status are derived (see `.docs/plans-progress-tracking.md`).
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

      const { error: upsertError } = await supabase
        .from('user_reading_plan_completions')
        .upsert(
          { user_id: user.id, user_plan_id: vars.userPlanId, day: vars.day },
          { onConflict: 'user_plan_id,day', ignoreDuplicates: true }
        );
      if (upsertError) throw upsertError;

      // Recompute current_day + status from the full completion set.
      const { data: comps, error: compError } = await supabase
        .from('user_reading_plan_completions')
        .select('day')
        .eq('user_plan_id', vars.userPlanId);
      if (compError) throw compError;

      const done = new Set((comps ?? []).map((c) => c.day));
      const finished = done.size >= vars.totalDays;
      let nextDay = vars.totalDays;
      for (let d = 1; d <= vars.totalDays; d += 1) {
        if (!done.has(d)) {
          nextDay = d;
          break;
        }
      }

      const { error: updateError } = await supabase
        .from('user_reading_plans')
        .update({
          current_day: nextDay,
          status: finished ? 'completed' : 'active',
          completed_at: finished ? new Date().toISOString() : null,
        })
        .eq('id', vars.userPlanId);
      if (updateError) throw updateError;

      return { finished };
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: planKeys.active });
      queryClient.invalidateQueries({ queryKey: planKeys.detail(vars.planId) });
    },
  });
}

/**
 * Soft-remove an active plan ("Remover plano") by archiving it, so it drops out
 * of the active list and frees a slot in Sugeridos.
 */
export function useArchivePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: { userPlanId: string; planId: string }) => {
      const { error } = await supabase
        .from('user_reading_plans')
        .update({ status: 'archived' })
        .eq('id', vars.userPlanId);
      if (error) throw error;
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

/**
 * Look up the display label for "today's" reading (the plan's current_day) for a
 * set of (plan, day) pairs in a single query. sort_order 0 is the lead reading.
 */
async function fetchNextReadingLabels(pairs: { planId: string; day: number }[]): Promise<Map<string, string>> {
  const labels = new Map<string, string>();
  if (pairs.length === 0) return labels;

  const planIds = [...new Set(pairs.map((p) => p.planId))];
  const { data, error } = await supabase
    .from('reading_plan_days')
    .select('plan_id, day, ref_label')
    .in('plan_id', planIds)
    .eq('sort_order', 0);

  if (error) throw error;

  for (const row of data ?? []) {
    labels.set(`${row.plan_id}:${row.day}`, row.ref_label);
  }
  return labels;
}
