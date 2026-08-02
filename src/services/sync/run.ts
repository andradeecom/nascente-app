import { syncCollection } from './collection';
import { syncReadingProgress } from './reading-progress';
import { syncPlanCatalog, syncEnrollments, syncPlanCompletions } from './reading-plans';
import { highlightsSync, bookmarksSync, notesSync } from './descriptors';
import { captureError, log } from '@/lib/posthog';
import type { SyncResult } from './types';

// In-flight guard: overlapping triggers (foreground + reconnect firing together)
// must not double-run. A trigger arriving mid-sync sets `queued` so one more pass
// runs afterward (covers a local edit made during a sync).
let running = false;
let queued = false;
let queuedUserId: string | null = null;

/**
 * Sync all local-first user data for a user: the three study collections
 * (highlights/bookmarks/notes — LWW + tombstones), reading-progress (append-only
 * set-union), and reading plans (catalog pull + enrollments status-merge +
 * completions union). Each runs sequentially to keep mobile network load gentle.
 * Returns the aggregate result. Re-entrant calls coalesce: a call while a sync is
 * running schedules exactly one re-run.
 */
export async function syncAll(userId: string): Promise<SyncResult> {
  if (running) {
    queued = true;
    queuedUserId = userId;
    return { pushed: 0, pulled: 0, errored: false };
  }

  running = true;
  const aggregate: SyncResult = { pushed: 0, pulled: 0, errored: false };
  // Each collection's failure is swallowed so one bad table can't abort the rest.
  // That's deliberate, but it also made sync failures completely invisible — the
  // engine is headless, so nobody sees them. Report to PostHog (no behavior change)
  // so a systematic failure is diagnosable instead of silent.
  const safe =
    (collection: string) =>
    (error: unknown): SyncResult => {
      captureError(error, { context: 'sync', collection });
      log.error('sync collection failed', { collection });
      return { pushed: 0, pulled: 0, errored: true };
    };
  try {
    // Called per-source (not in a loop) so each study descriptor keeps its
    // concrete generic type — a heterogeneous loop would collapse to a union.
    const results = [
      await syncCollection(highlightsSync, userId).catch(safe('highlights')),
      await syncCollection(bookmarksSync, userId).catch(safe('bookmarks')),
      await syncCollection(notesSync, userId).catch(safe('notes')),
      await syncReadingProgress(userId).catch(safe('reading_progress')),
      // Reading plans, in dependency order: catalog (pull-only) → enrollments →
      // completions (FK-references the enrollment, so it must land server-side first).
      await syncPlanCatalog(userId).catch(safe('plan_catalog')),
      await syncEnrollments(userId).catch(safe('plan_enrollments')),
      await syncPlanCompletions(userId).catch(safe('plan_completions')),
    ];
    for (const result of results) {
      aggregate.pushed += result.pushed;
      aggregate.pulled += result.pulled;
      aggregate.errored = aggregate.errored || result.errored;
    }
  } finally {
    running = false;
  }

  if (queued) {
    queued = false;
    const next = queuedUserId ?? userId;
    queuedUserId = null;
    void syncAll(next);
  }

  return aggregate;
}
