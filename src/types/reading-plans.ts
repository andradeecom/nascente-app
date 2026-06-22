import type { Enums, Tables, TablesInsert } from '@/types/database.types';

// ── Row aliases (derived from the generated Supabase types) ──────────────────

/** A plan in the catalog. owner_id null = curated/public; set = private AI/custom. */
export type ReadingPlan = Tables<'reading_plans'>;
/** A single day's reading(s) within a plan. */
export type ReadingPlanDay = Tables<'reading_plan_days'>;
/** A user's enrollment + progress pointer for a given plan. */
export type UserReadingPlan = Tables<'user_reading_plans'>;
/** A single day a user has marked complete. */
export type UserReadingPlanCompletion = Tables<'user_reading_plan_completions'>;

export type PlanCadence = Enums<'plan_cadence'>;
export type UserPlanStatus = Enums<'user_plan_status'>;

export type StartReadingPlanInput = Pick<TablesInsert<'user_reading_plans'>, 'plan_id'>;

// ── Screen view-models ───────────────────────────────────────────────────────

/**
 * An active plan as rendered in "Planos ativos": joins the user's enrollment
 * with its catalog plan, plus derived progress and the next reading label.
 */
export type ActiveReadingPlan = {
  userPlan: UserReadingPlan;
  plan: ReadingPlan;
  /** 0–100, computed from completed days / total_days. */
  progressPercent: number;
  /** Display label for the upcoming reading, e.g. "João 3". Null when finished. */
  nextReadingLabel: string | null;
};

/** A catalog plan as rendered in "Sugeridos" (not yet started by the user). */
export type SuggestedReadingPlan = ReadingPlan;
