import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useActivePlans, useStartPlan, useSuggestedPlans } from '@/hooks/use-reading-plans';
import { useRefetchOnFocus } from '@/hooks/use-refetch-on-focus';
import { useSyncOnFocus } from '@/hooks/use-sync';
import { useTier, useIsPro, useProGate } from '@/hooks/use-profile';
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
  // Reading plans are a Pro feature — non-Pro users get the Pro lock card.
  const isPro = useIsPro();
  const { openPro, requiresAccount } = useProGate();

  const activePlans = useActivePlans();
  const suggestedPlans = useSuggestedPlans();
  const startPlan = useStartPlan();
  const tier = useTier();

  // Pull cross-device plan changes when the tab gains focus, then refetch the
  // (now-stale) lists — React Query doesn't refetch on focus in RN, and a pull
  // alone wouldn't re-run these store-snapshot queryFns.
  useSyncOnFocus();
  useRefetchOnFocus(activePlans, suggestedPlans);

  // Free/Pro active-plan cap: block the "Começar" action once at the limit and
  // nudge toward Pro via the upsell modal (the server trigger is the backstop).
  const activeLimit = ACTIVE_PLAN_LIMIT[tier];
  const atActiveLimit = (activePlans.data?.length ?? 0) >= activeLimit;

  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const openLimitModal = useCallback(() => setLimitModalVisible(true), []);
  const closeLimitModal = useCallback(() => setLimitModalVisible(false), []);

  // Pro upsell CTA — dismiss the cap modal and open the paywall.
  const handleUpsellCta = useCallback(() => {
    setLimitModalVisible(false);
    openPro();
  }, [openPro]);

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

  // Pro lock card CTA (non-Pro users) → paywall, or sign-up first for guests.
  const handleUpgrade = openPro;

  const handleOpenPlan = useCallback(
    (planId: string) => {
      router.push(`/(tabs)/plans/${planId}`);
    },
    [router]
  );

  // "Criar com IA" → the AI plan generator (Pro-only; the tab is already Pro-gated).
  const handleCreateWithAi = useCallback(() => {
    router.push('/(tabs)/plans/create');
  }, [router]);

  return {
    translate,
    isAuthenticated,
    isPro,
    activePlans,
    suggestedPlans,
    formatMeta,
    handleStart,
    handleSignIn,
    handleUpgrade,
    proRequiresAccount: requiresAccount,
    handleOpenPlan,
    handleCreateWithAi,
    atActiveLimit,
    activeLimit,
    limitModalVisible,
    closeLimitModal,
    handleUpsellCta,
    isStarting: startPlan.isPending,
    startingPlanId: startPlan.variables?.id ?? null,
  };
}
