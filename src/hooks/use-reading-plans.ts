import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import type { ActiveReadingPlan, ReadingPlan, SuggestedReadingPlan } from '@/types/reading-plans';

export const planKeys = {
  all: ['plans'] as const,
  active: ['plans', 'active'] as const,
  suggested: ['plans', 'suggested'] as const,
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
