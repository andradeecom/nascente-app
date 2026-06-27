import { supabase } from '@/lib/supabase';
import { useSyncMetaStore } from './sync-meta';
import { usePlanCatalogStore } from '@/stores/plan-catalog';
import { usePlanEnrollmentsStore, deriveCurrentDay, deriveStatus } from '@/stores/plan-enrollments';
import { usePlanCompletionsStore, completedDaysFor } from '@/stores/plan-completions';
import { enrollmentKey, type LocalEnrollment } from '@/types/reading-plans';
import type { SyncResult } from './types';

const EPOCH = '1970-01-01T00:00:00Z';
const PUSH_CHUNK = 500;
const PULL_PAGE = 1000;
const ENROLLMENTS_CURSOR = 'plan-enrollments';

/**
 * Offline-first sync for reading plans, layered on the same engine as the study
 * tools + reading-progress (the local Zustand stores are the source of truth;
 * Supabase is the sync target). Three concerns, run in dependency order from
 * `syncAll`: catalog (pull-only) → enrollments (status-merge LWW) → completions
 * (append-only union). Enrollments push before completions because a completion
 * row FK-references its enrollment, which must exist server-side first.
 */

/** One-way pull of the curated catalog (owner_id null) into the device-global store. */
export async function syncPlanCatalog(): Promise<SyncResult> {
  try {
    const { data: plans, error: plansError } = await supabase
      .from('reading_plans')
      .select('*')
      .is('owner_id', null)
      .order('created_at', { ascending: true });
    if (plansError) throw plansError;

    const planIds = (plans ?? []).map((p) => p.id);
    let days: NonNullable<Awaited<ReturnType<typeof fetchCatalogDays>>> = [];
    if (planIds.length > 0) days = await fetchCatalogDays(planIds);

    usePlanCatalogStore.getState().replaceCatalog(plans ?? [], days);
    return { pushed: 0, pulled: (plans ?? []).length + days.length, errored: false };
  } catch {
    return { pushed: 0, pulled: 0, errored: true };
  }
}

async function fetchCatalogDays(planIds: string[]) {
  const { data, error } = await supabase
    .from('reading_plan_days')
    .select('*')
    .in('plan_id', planIds)
    .order('day', { ascending: true })
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Push dirty enrollments (status-merge LWW), then pull changed ones via a cursor. */
export async function syncEnrollments(userId: string): Promise<SyncResult> {
  let pushed = 0;
  let pulled = 0;
  let errored = false;

  try {
    pushed = await pushEnrollments(userId);
  } catch {
    errored = true;
  }
  try {
    pulled = await pullEnrollments(userId);
  } catch {
    errored = true;
  }
  return { pushed, pulled, errored };
}

async function pushEnrollments(userId: string): Promise<number> {
  const enrollments = Object.values(usePlanEnrollmentsStore.getState().byKey).filter(
    (e) => e.userId === userId && e.dirty
  );
  if (enrollments.length === 0) return 0;

  const catalog = usePlanCatalogStore.getState();
  const completions = usePlanCompletionsStore.getState().byKey;

  let pushed = 0;
  for (let i = 0; i < enrollments.length; i += PUSH_CHUNK) {
    const batch = enrollments.slice(i, i + PUSH_CHUNK);
    const payload = batch.map((e) => {
      // Send the derived current_day/status/completed_at so the server row is
      // self-consistent for any non-app reader; locally these stay derived.
      const total = catalog.plans[e.planId]?.total_days ?? 0;
      const done = completedDaysFor(completions, userId, e.id);
      const status = deriveStatus(e, done.size, total);
      return {
        id: e.id,
        user_id: e.userId,
        plan_id: e.planId,
        status,
        current_day: deriveCurrentDay(done, total),
        started_at: e.startedAt,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
        created_at: e.createdAt,
      };
    });

    const { data, error } = await supabase
      .from('user_reading_plans')
      .upsert(payload, { onConflict: 'id' })
      .select('plan_id,updated_at');
    if (error) {
      // The active-plan-cap trigger may reject a stale offline overshoot; leave
      // the row dirty (retried) and surface the error so the cycle reports it.
      throw error;
    }

    const serverByPlan = new Map<string, string>();
    for (const row of data ?? []) serverByPlan.set(row.plan_id, row.updated_at as string);
    for (const e of batch) {
      const serverUpdatedAt = serverByPlan.get(e.planId);
      if (!serverUpdatedAt) continue;
      usePlanEnrollmentsStore.getState().markSynced(enrollmentKey(userId, e.planId), e.updatedAt, serverUpdatedAt);
    }
    pushed += batch.length;
  }
  return pushed;
}

async function pullEnrollments(userId: string): Promise<number> {
  const meta = useSyncMetaStore.getState();
  let since = meta.getLastPulledAt(ENROLLMENTS_CURSOR, userId) ?? EPOCH;
  let pulled = 0;

  for (;;) {
    const { data, error } = await supabase
      .from('user_reading_plans')
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', since)
      .order('updated_at', { ascending: true })
      .limit(PULL_PAGE);
    if (error) throw error;

    const rows = data ?? [];
    if (rows.length === 0) break;

    usePlanEnrollmentsStore.getState().applyPulledMany(
      rows.map((row): { key: string; incoming: LocalEnrollment } => ({
        key: enrollmentKey(userId, row.plan_id),
        incoming: {
          id: row.id,
          userId: row.user_id,
          planId: row.plan_id,
          startedAt: row.started_at,
          createdAt: row.created_at,
          status: row.status,
          updatedAt: row.updated_at,
          dirty: false,
          syncedAt: null,
        },
      }))
    );

    since = rows[rows.length - 1].updated_at;
    useSyncMetaStore.getState().setLastPulledAt(ENROLLMENTS_CURSOR, userId, since);
    pulled += rows.length;

    if (rows.length < PULL_PAGE) break;
  }
  return pulled;
}

/**
 * Append-only completion sync (clone of reading-progress): push the whole local
 * set with `on conflict do nothing`, pull all rows and union them in. No cursor,
 * no tombstones — a completed day is permanent and the union is idempotent.
 */
export async function syncPlanCompletions(userId: string): Promise<SyncResult> {
  let pushed = 0;
  let pulled = 0;
  let errored = false;

  try {
    pushed = await pushCompletions(userId);
  } catch {
    errored = true;
  }
  try {
    pulled = await pullCompletions(userId);
  } catch {
    errored = true;
  }
  return { pushed, pulled, errored };
}

async function pushCompletions(userId: string): Promise<number> {
  const rows = Object.values(usePlanCompletionsStore.getState().byKey)
    .filter((c) => c.userId === userId)
    .map((c) => ({ user_id: c.userId, user_plan_id: c.userPlanId, day: c.day }));
  if (rows.length === 0) return 0;

  let pushed = 0;
  for (let i = 0; i < rows.length; i += PUSH_CHUNK) {
    const chunk = rows.slice(i, i + PUSH_CHUNK);
    const { error } = await supabase
      .from('user_reading_plan_completions')
      .upsert(chunk, { onConflict: 'user_plan_id,day', ignoreDuplicates: true });
    if (error) throw error;
    pushed += chunk.length;
  }
  return pushed;
}

async function pullCompletions(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('user_reading_plan_completions')
    .select('user_plan_id,day,completed_at')
    .eq('user_id', userId);
  if (error) throw error;

  const rows = data ?? [];
  usePlanCompletionsStore.getState().mergeRemote(
    userId,
    rows.map((r) => ({ userPlanId: r.user_plan_id, day: r.day, completedAt: r.completed_at }))
  );
  return rows.length;
}
