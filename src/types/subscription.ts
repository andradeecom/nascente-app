import type { Enums } from '@/types/database.types';

/** Subscription level. Source of truth is `profiles.tier` (server/billing-controlled). */
export type AccountTier = Enums<'account_tier'>;

/** Max simultaneously-active reading plans per tier (see monetization-strategy.md). */
export const ACTIVE_PLAN_LIMIT: Record<AccountTier, number> = {
  free: 2,
  pro: 50,
};

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
