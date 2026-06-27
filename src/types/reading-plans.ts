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

/**
 * One day of a plan as rendered on the Plan detail screen. A plan can assign
 * several readings to the same day (multiple `reading_plan_days` rows), so they
 * are grouped here. `bookId`/`chapter` point at the lead reading (sort_order 0)
 * for the Reader handoff. `completed` is per-day.
 */
export type PlanDayGroup = {
  day: number;
  /** Joined reading labels for the day, e.g. "João 1 · João 2". */
  label: string;
  bookId: number | null;
  /** Lead reading's first chapter — where the Reader opens. */
  chapter: number | null;
  /** Lead reading's last chapter — where the day is considered "finished". */
  chapterEnd: number | null;
  completed: boolean;
};

/**
 * Everything the Plan detail screen needs: the catalog plan, its grouped days,
 * and the user's enrollment (null = not started → preview mode).
 */
export type PlanDetail = {
  plan: ReadingPlan;
  days: PlanDayGroup[];
  enrollment: UserReadingPlan | null;
};

// ── Local-first records (offline sync via src/services/sync/reading-plans.ts) ─

/**
 * A user's plan enrollment as stored on-device (the local source of truth; see
 * `src/stores/plan-enrollments.ts`). Superset of the `user_reading_plans` row's
 * user-authored fields plus sync metadata. **`current_day`/`completed_at` are NOT
 * stored** — they're derived from the completion set on read (see the derive
 * helpers in the store). `status` is stored, but archived is treated as the only
 * authoritative status bit on merge; active-vs-completed is also derived.
 * Synced with status-merge (archived sticky-wins, startedAt earliest-wins, else
 * LWW on `updatedAt`).
 */
export type LocalEnrollment = {
  /** Client-generated uuid (so a plan can be started offline); becomes the server PK. */
  id: string;
  userId: string;
  planId: string;
  startedAt: string;
  createdAt: string;
  status: UserPlanStatus;
  /** LWW key (server-authoritative once round-tripped). */
  updatedAt: string;
  /** Local change not yet pushed. */
  dirty?: boolean;
  syncedAt?: string | null;
};

/**
 * A single completed plan day as stored on-device (append-only log; see
 * `src/stores/plan-completions.ts`). Mirrors `user_reading_plan_completions`;
 * synced by set-union (idempotent on `(user_plan_id, day)`), like reading-progress.
 */
export type LocalPlanCompletion = {
  userId: string;
  /** The enrollment id (`user_reading_plans.id` / `LocalEnrollment.id`). */
  userPlanId: string;
  day: number;
  completedAt: string;
};

/** Stable per-user, per-plan key (one enrollment per (user, plan) — matches the DB UNIQUE). */
export function enrollmentKey(userId: string, planId: string): string {
  return `${userId}:${planId}`;
}

/** Stable per-user, per-enrollment, per-day key (append-only completion log). */
export function planCompletionKey(userId: string, userPlanId: string, day: number): string {
  return `${userId}:${userPlanId}:${day}`;
}
