import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useActivePlans, useStartPlan, useSuggestedPlans } from '@/hooks/use-reading-plans';
import { useAuthStore } from '@/stores/auth';
import { useTranslate } from '@/i18n';
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
      startPlan.mutate(plan);
    },
    [startPlan]
  );

  const handleSignIn = useCallback(() => {
    router.push('/register');
  }, [router]);

  return {
    translate,
    isAuthenticated,
    activePlans,
    suggestedPlans,
    formatMeta,
    handleStart,
    handleSignIn,
    isStarting: startPlan.isPending,
    startingPlanId: startPlan.variables?.id ?? null,
  };
}
