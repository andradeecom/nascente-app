import { syncCollection } from './collection';
import { syncReadingProgress } from './reading-progress';
import { syncPlanCatalog, syncEnrollments, syncPlanCompletions } from './reading-plans';
import { highlightsSync, bookmarksSync, notesSync } from './descriptors';
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
  const safe = (): SyncResult => ({ pushed: 0, pulled: 0, errored: true });
  try {
    // Called per-source (not in a loop) so each study descriptor keeps its
    // concrete generic type — a heterogeneous loop would collapse to a union.
    const results = [
      await syncCollection(highlightsSync, userId).catch(safe),
      await syncCollection(bookmarksSync, userId).catch(safe),
      await syncCollection(notesSync, userId).catch(safe),
      await syncReadingProgress(userId).catch(safe),
      // Reading plans, in dependency order: catalog (pull-only) → enrollments →
      // completions (FK-references the enrollment, so it must land server-side first).
      await syncPlanCatalog().catch(safe),
      await syncEnrollments(userId).catch(safe),
      await syncPlanCompletions(userId).catch(safe),
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
