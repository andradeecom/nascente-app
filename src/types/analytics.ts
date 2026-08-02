/**
 * The app's analytics event vocabulary — the single source of truth for what we
 * send to PostHog. Events are a typed map (name → properties) so `capture()` is
 * compile-checked rather than stringly-typed: a typo in an event name or a
 * missing/renamed property is a build error, not a silently-missing funnel step
 * discovered weeks later in the dashboard.
 *
 * **Privacy rule (enforced by these types, not just convention):** no property
 * here carries user-authored or scripture text. Note bodies, search queries,
 * verse text, AI prompts/completions, emails and names are never sent — only
 * lengths, counts, ids and enums. When adding an event, keep that shape; if a
 * new property would carry free text, send its length instead.
 *
 * Naming: `snake_case`, `noun_verb-past-tense` (`plan_started`, not `startPlan`).
 * PostHog groups events by exact string, so renaming one splits its history.
 */

/**
 * Which Pro-gated surface sent the user to the paywall (`useProGate`).
 *
 * There is deliberately no `reader_verse`: for non-Pro users the Reader renders
 * verses as plain, non-interactive views, so a verse tap is a silent no-op rather
 * than an upsell (reading is intentionally not a tap-trap). Add a value here only
 * when a surface actually calls `openPro`.
 */
export type ProGateSource =
  'chapter_summary' | 'translation_picker' | 'study_tab' | 'plans_tab' | 'home_plans' | 'home_devotional';

/** Which of the two plan-day completion triggers fired (see Reading plans). */
export type PlanCompletionSource = 'reader' | 'detail';

/** The study-tool kinds, mirroring `StudyItem['type']`. */
export type StudyItemType = 'highlight' | 'note' | 'bookmark';

/** Onboarding steps, in flow order. */
export type OnboardingStep = 'language' | 'translation' | 'preferences' | 'account';

/**
 * Event name → properties. `Record<string, never>` means "no properties" — the
 * global super properties (is_pro, is_authenticated, app_locale, translation_id,
 * theme) are attached to every event by `use-analytics.ts`, so most events need
 * far fewer of their own than they otherwise would.
 */
export type AnalyticsEventMap = {
  // ── Onboarding funnel ────────────────────────────────────────────────────
  onboarding_started: Record<string, never>;
  onboarding_step_completed: { step: OnboardingStep; step_index: number };
  /**
   * The account step's fork. No `'login'` value: that path is a `<Link>` inside
   * the register screen rather than a handler, so there's no seam to capture it —
   * and `signed_in` during onboarding already identifies those users.
   */
  onboarding_account_choice: { choice: 'register' | 'guest' };
  onboarding_completed: { entry: 'read' | 'plans' };

  // ── Pro funnel (the money path) ──────────────────────────────────────────
  pro_gate_hit: { source: ProGateSource; requires_account: boolean };
  paywall_viewed: Record<string, never>;
  paywall_plan_selected: { cycle: string };
  purchase_started: { cycle: string; price?: number; currency?: string };
  purchase_completed: { cycle: string; price?: number; currency?: string };
  purchase_cancelled: { cycle: string };
  purchase_failed: { cycle: string; reason: string };
  purchase_restored: { had_entitlement: boolean };

  // ── Auth ─────────────────────────────────────────────────────────────────
  signed_up: { method: AuthMethod; needs_confirmation: boolean };
  signed_in: { method: AuthMethod };
  signed_out: Record<string, never>;

  // ── Reading (the free core) ──────────────────────────────────────────────
  chapter_read: { book_id: number; chapter: number; translation_id: string };
  translation_changed: { from: string; to: string; tier: string };
  reading_streak_reached: { days: number };

  // ── Study tools (Pro) ────────────────────────────────────────────────────
  highlight_created: { color: string; book_id: number; chapter: number };
  highlight_removed: { book_id: number; chapter: number };
  /** `body_length` only — the note body itself is never sent. */
  note_saved: { book_id: number; chapter: number; body_length: number };
  note_deleted: { book_id: number; chapter: number };
  bookmark_toggled: { enabled: boolean; book_id: number; chapter: number };
  study_item_opened: { type: StudyItemType };
  study_items_cleared: { type: StudyItemType; count: number };

  // ── AI features (client-side usage; cost/latency come from the server) ───
  ai_generate_requested: { prompt_type: string };
  /** `from_cache` is the key metric — only cache misses cost money. */
  ai_generate_succeeded: { prompt_type: string; from_cache: boolean };
  ai_generate_failed: { prompt_type: string; code: string };
  ai_plan_generated: { days: number; has_topic: boolean };
  ai_plan_saved: { days: number };

  // ── Reading plans (Pro engagement) ───────────────────────────────────────
  plan_started: { plan_id: string; is_ai_generated: boolean; total_days: number };
  plan_limit_reached: { limit: number; tier: string };
  plan_day_completed: { plan_id: string; day: number; source: PlanCompletionSource };
  plan_finished: { plan_id: string; total_days: number };
  plan_archived: { plan_id: string };
};

/** How the user authenticated. */
export type AuthMethod = 'email' | 'google' | 'apple';

/** Any valid event name. */
export type AnalyticsEvent = keyof AnalyticsEventMap;

/**
 * Global properties attached to every event, so segmentation questions ("do Pro
 * users in Spanish finish plans more often?") are answerable without adding the
 * same property to 25 event definitions.
 */
export type AnalyticsSuperProperties = {
  is_pro: boolean;
  is_authenticated: boolean;
  app_locale: string;
  translation_id: string;
  theme: string;
};
