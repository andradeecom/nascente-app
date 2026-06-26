import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useActivePlans, useStartPlan, useSuggestedPlans } from '@/hooks/use-reading-plans';
import { useRefetchOnFocus } from '@/hooks/use-refetch-on-focus';
import { useTier } from '@/hooks/use-profile';
import { useAuthStore } from '@/stores/auth';
import { useTranslate } from '@/i18n';
import { ACTIVE_PLAN_LIMIT, isPlanLimitError } from '@/types/subscription';
import type { PlanCadence, ReadingPlan } from '@/types/reading-plans';

// Map each cadence to its typed translation key (avoids a dynamic key that
// TxKeyPath — a literal union — can't validate).
const cadenceKey: Record<PlanCadence, 'plans.cadence.daily'> = {
  daily: 'plans.cadence.daily',
};

/**
 * Screen-private logic for the Plans tab: loads active + suggested plans and
 * wires the "Começar" action. Presentation stays in index.tsx.
 */
export default function usePlansScreen() {
  const translate = useTranslate();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const activePlans = useActivePlans();
  const suggestedPlans = useSuggestedPlans();
  const startPlan = useStartPlan();
  const tier = useTier();

  // React Query doesn't refetch on focus in RN (no browser window), so a tab
  // switch back here would serve stale plan data — refetch the (stale) lists on focus.
  useRefetchOnFocus(activePlans, suggestedPlans);

  // Free/Pro active-plan cap: block the "Começar" action once at the limit and
  // nudge toward Pro via the upsell modal (the server trigger is the backstop).
  const activeLimit = ACTIVE_PLAN_LIMIT[tier];
  const atActiveLimit = (activePlans.data?.length ?? 0) >= activeLimit;

  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const openLimitModal = useCallback(() => setLimitModalVisible(true), []);
  const closeLimitModal = useCallback(() => setLimitModalVisible(false), []);

  // Pro upsell CTA. No Pro/paywall screen exists yet (see notes.md RevenueCat),
  // so for now this just dismisses; route to the paywall once it's built.
  const handleUpsellCta = useCallback(() => {
    setLimitModalVisible(false);
  }, []);

  // Build the "30 dias · diário" meta line from a plan's duration + cadence.
  const formatMeta = useCallback(
    (plan: ReadingPlan) => {
      const duration = translate('plans.duration', { count: plan.total_days });
      const cadence = translate(cadenceKey[plan.cadence]);
      return translate('plans.meta', { duration, cadence });
    },
    [translate]
  );

  const handleStart = useCallback(
    (plan: ReadingPlan) => {
      if (startPlan.isPending) return;
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
    },
    [startPlan, atActiveLimit, openLimitModal, translate]
  );

  const handleSignIn = useCallback(() => {
    router.push('/register');
  }, [router]);

  const handleOpenPlan = useCallback(
    (planId: string) => {
      router.push(`/(tabs)/plans/${planId}`);
    },
    [router]
  );

  return {
    translate,
    isAuthenticated,
    activePlans,
    suggestedPlans,
    formatMeta,
    handleStart,
    handleSignIn,
    handleOpenPlan,
    atActiveLimit,
    activeLimit,
    limitModalVisible,
    closeLimitModal,
    handleUpsellCta,
    isStarting: startPlan.isPending,
    startingPlanId: startPlan.variables?.id ?? null,
  };
}
