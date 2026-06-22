import { useCallback } from 'react';
import { useActivePlans, useStartPlan, useSuggestedPlans } from '@/hooks/use-reading-plans';
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

  return {
    translate,
    activePlans,
    suggestedPlans,
    formatMeta,
    handleStart,
    isStarting: startPlan.isPending,
    startingPlanId: startPlan.variables?.id ?? null,
  };
}
