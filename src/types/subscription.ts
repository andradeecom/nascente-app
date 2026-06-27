import type { Enums } from '@/types/database.types';

/** Subscription level. Source of truth is `profiles.tier` (server/billing-controlled). */
export type AccountTier = Enums<'account_tier'>;

/** Max simultaneously-active reading plans per tier (see monetization-strategy.md). */
export const ACTIVE_PLAN_LIMIT: Record<AccountTier, number> = {
  free: 2,
  pro: 50,
};

/** Billing cadence offered on the paywall. */
export type ProBillingCycle = 'annual' | 'monthly';

/**
 * Pro subscription offerings shown on the paywall. Display prices/labels live in
 * i18n (`paywall.plans.*`, locale-formatted); this just enumerates the offers and
 * carries the RevenueCat package identifier each maps to (wired once RevenueCat
 * lands — see .docs/notes.md). `annual` is the recommended/default selection.
 */
export const PRO_OFFERS: { cycle: ProBillingCycle; packageId: string }[] = [
  { cycle: 'annual', packageId: 'nascente_pro_annual' },
  { cycle: 'monthly', packageId: 'nascente_pro_monthly' },
];

/** Default-selected offer on the paywall (best value). */
export const DEFAULT_PRO_OFFER: ProBillingCycle = 'annual';

/**
 * Thrown (and normalized from the DB trigger's `PLAN_LIMIT_REACHED`) when a user
 * tries to start a plan beyond their tier's active-plan limit. The UI catches this
 * to show the Pro upsell instead of a generic error.
 */
export class PlanLimitError extends Error {
  readonly limit: number;
  constructor(limit: number) {
    super('PLAN_LIMIT_REACHED');
    this.name = 'PlanLimitError';
    this.limit = limit;
  }
}

/** True when an error is (or wraps) the active-plan cap being hit. */
export function isPlanLimitError(error: unknown): error is PlanLimitError {
  return error instanceof PlanLimitError;
}
