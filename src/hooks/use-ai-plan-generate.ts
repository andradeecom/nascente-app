import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';
import { useReaderStore } from '@/stores/reader';
import { useLocaleStore } from '@/stores/locale';
import { profileKeys } from '@/hooks/use-profile';
import { planKeys } from '@/hooks/use-reading-plans';
import { supabase } from '@/lib/supabase';
import { callAiPlanGenerate } from '@/services/ai-plan';
import { getBookName } from '@/services/bible';
import { syncAll } from '@/services/sync';
import { capture } from '@/lib/posthog';
import { usePlanCatalogStore } from '@/stores/plan-catalog';
import { usePlanEnrollmentsStore, deriveStatus } from '@/stores/plan-enrollments';
import { usePlanCompletionsStore, completedDaysFor } from '@/stores/plan-completions';
import { ACTIVE_PLAN_LIMIT, PlanLimitError } from '@/types/subscription';
import type { AccountTier } from '@/types/subscription';
import type { AiPlanPreview } from '@/types/ai-plan';
import type { ReadingPlan, ReadingPlanDay } from '@/types/reading-plans';

/** Build a "João 3" / "João 3-5" display label from numeric refs + a resolved book name. */
function refLabel(bookName: string, chapterStart: number, chapterEnd: number): string {
  const chapters = chapterEnd > chapterStart ? `${chapterStart}-${chapterEnd}` : `${chapterStart}`;
  return `${bookName} ${chapters}`.trim();
}

/**
 * AI plan generator (see .docs/ai-features.md §5). Two steps, deliberately split
 * so the user previews before anything is saved:
 *  - `useGenerateAiPlan` — calls the Edge Function, returns a preview. This is the
 *    metered step (quota charged server-side at generation, even if discarded).
 *  - `useSaveAiPlan` — on confirm, inserts the plan + days (RLS owner-scoped),
 *    mirrors them into the local catalog, and enrolls the user (reusing the same
 *    active-plan-cap check as `useStartPlan`).
 */
export function useGenerateAiPlan() {
  const locale = useLocaleStore((s) => s.locale) ?? 'pt';

  return useMutation({
    mutationFn: async (vars: { topic: string; days: number }): Promise<AiPlanPreview> => {
      return callAiPlanGenerate({
        topic: vars.topic,
        days: vars.days,
        locale: locale as 'en' | 'es' | 'pt',
      });
    },
    onSuccess: (_preview, vars) => {
      // The metered step: quota is charged server-side at generation, even if the
      // user discards the preview. Pairing this with `ai_plan_saved` gives the
      // generate → save drop-off, i.e. how much AI budget is spent on plans that
      // are never kept. `has_topic` (not the topic text) — free-text input is
      // user-authored content and never leaves the device.
      capture('ai_plan_generated', { days: vars.days, has_topic: vars.topic.trim().length > 0 });
    },
  });
}

export function useSaveAiPlan() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const translationId = useReaderStore((s) => s.translationId);

  return useMutation({
    mutationFn: async (preview: AiPlanPreview): Promise<ReadingPlan> => {
      if (!user) throw new Error('Not authenticated');

      // Enforce the active-plan cap up front (same rule as useStartPlan), so we
      // don't insert a plan we can't enroll in. The DB trigger still backstops.
      const tier = queryClient.getQueryData<{ tier: AccountTier }>(profileKeys.me)?.tier ?? 'free';
      const limit = ACTIVE_PLAN_LIMIT[tier];
      const { plans } = usePlanCatalogStore.getState();
      const completionsByKey = usePlanCompletionsStore.getState().byKey;
      const activeCount = Object.values(usePlanEnrollmentsStore.getState().byKey).filter((e) => {
        if (e.userId !== user.id) return false;
        const total = plans[e.planId]?.total_days ?? 0;
        return deriveStatus(e, completedDaysFor(completionsByKey, user.id, e.id).size, total) === 'active';
      }).length;
      if (activeCount >= limit) throw new PlanLimitError(limit);

      // Resolve localized book names for each day from the user's current
      // translation (names live in SQLite, per-translation), to build ref_labels.
      const bookIds = [...new Set(preview.days.map((d) => d.book_id))];
      const nameByBook: Record<number, string> = {};
      await Promise.all(
        bookIds.map(async (id) => {
          nameByBook[id] = await getBookName(translationId, id);
        })
      );

      // Insert the plan (RLS: owner_id must equal auth.uid()).
      const { data: plan, error: planError } = await supabase
        .from('reading_plans')
        .insert({
          owner_id: user.id,
          title: preview.title,
          description: preview.description || null,
          lang: (useLocaleStore.getState().locale ?? 'pt') as string,
          total_days: preview.totalDays,
          is_ai_generated: true,
        })
        .select()
        .single();
      if (planError || !plan) throw planError ?? new Error('Failed to create plan');

      // Insert its days.
      const dayRows = preview.days.map((d) => ({
        plan_id: plan.id,
        day: d.day,
        ref_label: refLabel(nameByBook[d.book_id] || '', d.chapter_start, d.chapter_end),
        book_id: d.book_id,
        chapter_start: d.chapter_start,
        chapter_end: d.chapter_end,
        sort_order: 0,
      }));
      const { data: days, error: daysError } = await supabase.from('reading_plan_days').insert(dayRows).select();
      if (daysError || !days) {
        // Best-effort rollback of the orphaned plan so a retry is clean.
        await supabase.from('reading_plans').delete().eq('id', plan.id);
        throw daysError ?? new Error('Failed to create plan days');
      }

      // Mirror into the local catalog so the Plans screens see it immediately/offline.
      usePlanCatalogStore.getState().addOwnPlan(plan as ReadingPlan, days as ReadingPlanDay[]);

      // Auto-enroll (local-first) + background sync.
      usePlanEnrollmentsStore.getState().start(user.id, plan.id);
      void syncAll(user.id);

      return plan as ReadingPlan;
    },
    onSuccess: (plan) => {
      capture('ai_plan_saved', { days: plan.total_days });
      queryClient.invalidateQueries({ queryKey: planKeys.active });
      queryClient.invalidateQueries({ queryKey: planKeys.suggested });
    },
  });
}
