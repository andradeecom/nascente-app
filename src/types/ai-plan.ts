/** AI reading-plan generator types (see .docs/ai-features.md §5 — AI plan generator). */

/** Bounds shared with the ai-plan-generate Edge Function (keep in sync). */
export const AI_PLAN_MIN_DAYS = 3;
export const AI_PLAN_MAX_DAYS = 40;

export type AiPlanGenerateRequest = {
  topic: string;
  days: number;
  locale: 'en' | 'es' | 'pt';
};

/** One generated day — numeric refs only; the display label is built client-side
 *  from the user's translation (book names are localized, in SQLite). */
export type AiPlanDay = {
  day: number;
  book_id: number;
  chapter_start: number;
  chapter_end: number;
};

/** The generated plan preview returned by the Edge Function. NOT yet persisted —
 *  the user confirms it before it becomes a real reading_plans row. */
export type AiPlanPreview = {
  title: string;
  description: string;
  days: AiPlanDay[];
  totalDays: number;
};

export type AiPlanGenerateErrorCode =
  | 'NOT_AUTHENTICATED'
  | 'NOT_PRO'
  | 'BAD_REQUEST'
  | 'GEMINI_ERROR'
  | 'AI_PLAN_LIMIT_REACHED'
  | 'COST_CEILING_REACHED'
  | 'INTERNAL_ERROR';

export class AiPlanGenerateError extends Error {
  readonly code: AiPlanGenerateErrorCode;
  /** For quota errors: when the user's 30-day cycle resets (YYYY-MM-DD), if the server sent it. */
  readonly resetAt?: string;
  constructor(code: AiPlanGenerateErrorCode, message?: string, resetAt?: string) {
    super(message ?? code);
    this.name = 'AiPlanGenerateError';
    this.code = code;
    this.resetAt = resetAt;
  }
}

/**
 * True when generation failed because the user hit a monthly usage quota — either
 * the per-feature AI-plan cap (10/cycle) or the global cost ceiling. There's no
 * "buy more credits" product yet (V2), so the UI shows an informational
 * out-of-credits notice with the reset date, not an upsell.
 */
export function isAiPlanQuotaError(error: unknown): error is AiPlanGenerateError {
  return (
    error instanceof AiPlanGenerateError &&
    (error.code === 'AI_PLAN_LIMIT_REACHED' || error.code === 'COST_CEILING_REACHED')
  );
}

/** Whole days from now until `resetAt` (YYYY-MM-DD), floored at 0. */
export function daysUntilReset(resetAt: string | undefined): number {
  if (!resetAt) return 0;
  const ms = new Date(`${resetAt}T00:00:00Z`).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}
