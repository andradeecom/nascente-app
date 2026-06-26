import type { SyncableRecord } from './types';

/**
 * Pure helpers shared by the three study stores (highlights/bookmarks/notes) for
 * the sync engine seam. Kept here (not duplicated per store) so the LWW merge
 * rule lives in exactly one place. All return a new `byKey` map (or the same
 * reference when nothing changed) so callers stay immutable-friendly.
 */

/**
 * Last-write-wins merge of a pulled remote row into the local map. The single
 * rule for every case (edit-vs-edit, delete-vs-edit, resurrect): the incoming
 * row wins iff its `updatedAt` is strictly newer than the local row's. A write
 * always clears `deletedAt`, so "newest write wins" also resolves tombstones.
 * Never sets `dirty` — pulled rows are, by definition, already on the server.
 */
export function applyPulledRow<T extends SyncableRecord>(
  byKey: Record<string, T>,
  key: string,
  incoming: T
): Record<string, T> {
  const local = byKey[key];
  if (local && local.updatedAt >= incoming.updatedAt) return byKey; // local same-or-newer wins
  return { ...byKey, [key]: { ...incoming, dirty: false } };
}

/**
 * After a successful push, clear `dirty` and re-anchor `updatedAt` to the
 * server-returned value (neutralizes client clock skew for future comparisons).
 * No-ops if the row was edited again locally since the push snapshot (its
 * `updatedAt` no longer matches), so that edit stays `dirty` for the next cycle.
 */
export function markRowSynced<T extends SyncableRecord>(
  byKey: Record<string, T>,
  key: string,
  pushedUpdatedAt: string,
  serverUpdatedAt: string
): Record<string, T> {
  const row = byKey[key];
  if (!row) return byKey;
  if (row.updatedAt !== pushedUpdatedAt) return byKey; // edited again mid-sync → keep dirty
  return {
    ...byKey,
    [key]: { ...row, dirty: false, updatedAt: serverUpdatedAt, syncedAt: new Date().toISOString() },
  };
}

/**
 * One-time backfill run on rehydrate: legacy persisted rows that predate sync
 * lack `updatedAt`/`dirty` (notably every existing bookmark, which never had an
 * `updatedAt`). Stamp them so the existing local-only corpus uploads on the
 * first sync, without touching already-migrated rows.
 */
export function migrateSyncMeta<T extends SyncableRecord>(byKey: Record<string, T>): Record<string, T> {
  let changed = false;
  const next: Record<string, T> = {};
  for (const [key, row] of Object.entries(byKey)) {
    if (row.updatedAt && row.dirty !== undefined) {
      next[key] = row;
      continue;
    }
    changed = true;
    next[key] = {
      ...row,
      updatedAt: row.updatedAt ?? row.createdAt ?? new Date().toISOString(),
      deletedAt: row.deletedAt ?? null,
      dirty: true,
      syncedAt: row.syncedAt ?? null,
    };
  }
  return changed ? next : byKey;
}
