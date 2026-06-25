import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useReaderStore } from '@/stores/reader';
import { usePlanReadingStore } from '@/stores/plan-reading';
import { useTranslate } from '@/i18n';
import {
  useActivePlans,
  useArchivePlan,
  useMarkPlanDayComplete,
  usePlanDetail,
  useStartPlan,
} from '@/hooks/use-reading-plans';
import { useTier } from '@/hooks/use-profile';
import { ACTIVE_PLAN_LIMIT, isPlanLimitError } from '@/types/subscription';
import type { PlanCadence, PlanDayGroup, ReadingPlan } from '@/types/reading-plans';

// Mirror the cadence → typed key map used by the Plans list (literal-union safe).
const cadenceKey: Record<PlanCadence, 'plans.cadence.daily'> = {
  daily: 'plans.cadence.daily',
};

/**
 * Screen-private logic for Plan detail. Loads the plan + days + enrollment, and
 * wires start / open-reading / mark-complete / remove. Presentation in index.tsx.
 */
export default function usePlanDetailScreen() {
  const translate = useTranslate();
  const router = useRouter();
  const { planId } = useLocalSearchParams<{ planId: string }>();

  const detail = usePlanDetail(planId);
  const activePlans = useActivePlans();
  const startPlan = useStartPlan();
  const markComplete = useMarkPlanDayComplete();
  const archivePlan = useArchivePlan();
  const tier = useTier();

  // Free/Pro active-plan cap — same gate as the Plans list, applied to the
  // preview-mode "Começar" CTA here, via the shared upsell modal.
  const activeLimit = ACTIVE_PLAN_LIMIT[tier];
  const atActiveLimit = (activePlans.data?.length ?? 0) >= activeLimit;

  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const openLimitModal = useCallback(() => setLimitModalVisible(true), []);
  const closeLimitModal = useCallback(() => setLimitModalVisible(false), []);

  // Pro upsell CTA. No paywall screen yet (see notes.md RevenueCat) — dismiss
  // for now; route to the paywall once it exists.
  const handleUpsellCta = useCallback(() => {
    setLimitModalVisible(false);
  }, []);

  const plan = detail.data?.plan ?? null;
  const days = detail.data?.days ?? [];
  const enrollment = detail.data?.enrollment ?? null;
  const isEnrolled = enrollment !== null;

  const completedCount = days.filter((d) => d.completed).length;
  const progressPercent = plan && plan.total_days > 0 ? Math.round((completedCount / plan.total_days) * 100) : 0;

  const formatMeta = useCallback(
    (p: ReadingPlan) =>
      translate('plans.meta', {
        duration: translate('plans.duration', { count: p.total_days }),
        cadence: translate(cadenceKey[p.cadence]),
      }),
    [translate]
  );

  const handleStart = useCallback(() => {
    if (!plan || startPlan.isPending) return;
    if (atActiveLimit) {
      openLimitModal();
      return;
    }
    startPlan.mutate(plan, {
      onError: (error) => {
        if (isPlanLimitError(error)) {
          openLimitModal();
        } else {
          Toast.show({ type: 'error', text1: translate('plans.loadError') });
        }
      },
    });
  }, [plan, startPlan, atActiveLimit, openLimitModal, translate]);

  const handleOpenReading = useCallback(
    (day: PlanDayGroup) => {
      if (day.bookId && day.chapter) {
        useReaderStore.getState().setPosition(day.bookId, day.chapter);

        // Enrolled + not-yet-done → hand the Reader a session so it can offer to
        // finish (and auto-complete) the day at the end of its last chapter.
        if (enrollment && plan && !day.completed) {
          usePlanReadingStore.getState().startSession({
            userPlanId: enrollment.id,
            planId: plan.id,
            day: day.day,
            totalDays: plan.total_days,
            bookId: day.bookId,
            lastChapter: day.chapterEnd ?? day.chapter,
          });
        }
      }
      router.push('/(tabs)/reader');
    },
    [router, enrollment, plan]
  );

  // Interim manual trigger. The same mutation will be called automatically from
  // the Reader once it can detect "finished the day's passage" (see
  // .docs/plans-progress-tracking.md §3.3). Completion is one-way.
  const handleToggleComplete = useCallback(
    (day: PlanDayGroup) => {
      if (!enrollment || !plan || day.completed || markComplete.isPending) return;
      markComplete.mutate({
        userPlanId: enrollment.id,
        planId: plan.id,
        day: day.day,
        totalDays: plan.total_days,
      });
    },
    [enrollment, plan, markComplete]
  );

  const handleRemove = useCallback(() => {
    if (!enrollment || !plan) return;
    Alert.alert(translate('plans.remove.title'), translate('plans.remove.message'), [
      { text: translate('common.cancel'), style: 'cancel' },
      {
        text: translate('plans.remove.confirm'),
        style: 'destructive',
        onPress: () =>
          archivePlan.mutate({ userPlanId: enrollment.id, planId: plan.id }, { onSuccess: () => router.back() }),
      },
    ]);
  }, [enrollment, plan, archivePlan, router, translate]);

  const handleBack = () => router.back();

  return {
    translate,
    plan,
    days,
    isEnrolled,
    progressPercent,
    isLoading: detail.isLoading,
    isError: detail.isError,
    isStarting: startPlan.isPending,
    markingDay: markComplete.isPending ? (markComplete.variables?.day ?? null) : null,
    formatMeta,
    handleStart,
    handleOpenReading,
    handleToggleComplete,
    handleRemove,
    handleBack,
    activeLimit,
    limitModalVisible,
    closeLimitModal,
    handleUpsellCta,
  };
}
