import { supabase } from '@/lib/supabase';
import { useSyncMetaStore } from './sync-meta';
import type { CollectionDescriptor, RemoteRow, SyncableRecord, SyncResult } from './types';

const EPOCH = '1970-01-01T00:00:00Z';
const PUSH_CHUNK = 500;
const PULL_PAGE = 1000;

/**
 * Sync one study collection (highlights / bookmarks / notes) for a user. The
 * three tables share the verse-identity shape, so this one engine drives all
 * three via a `CollectionDescriptor`. Push runs before pull so our just-uploaded
 * rows echo back as last-write-wins ties (no flicker). Every step is idempotent
 * and resumable: a failed push leaves rows `dirty` to retry; the pull cursor
 * only advances per fully-merged page.
 */
export async function syncCollection<T extends SyncableRecord>(
  desc: CollectionDescriptor<T>,
  userId: string
): Promise<SyncResult> {
  let pushed = 0;
  let pulled = 0;
  let errored = false;

  try {
    pushed = await pushDirty(desc, userId);
  } catch {
    errored = true;
  }

  try {
    pulled = await pullChanges(desc, userId);
  } catch {
    errored = true;
  }

  return { pushed, pulled, errored };
}

/** Upsert every locally-changed row (incl. tombstones) on the verse-identity conflict target. */
async function pushDirty<T extends SyncableRecord>(desc: CollectionDescriptor<T>, userId: string): Promise<number> {
  const dirty = Object.values(desc.store.getByKey()).filter((r) => r.userId === userId && r.dirty);
  if (dirty.length === 0) return 0;

  let pushed = 0;
  for (let i = 0; i < dirty.length; i += PUSH_CHUNK) {
    const batch = dirty.slice(i, i + PUSH_CHUNK);
    const payload = batch.map((r) => desc.toRemote(r));

    // `desc.table` is a union of the three tables; the payload is built by the
    // descriptor's validated `toRemote` mapper, so cast past the union-narrowed
    // overload signature.
    const { data, error } = await (supabase.from(desc.table) as ReturnType<typeof supabase.from>)
      .upsert(payload, { onConflict: 'user_id,book_id,chapter,verse' })
      .select('book_id,chapter,verse,updated_at');
    if (error) throw error;

    // Re-anchor each pushed row to the server `updated_at` (neutralizes clock skew).
    const serverByKey = new Map<string, string>();
    for (const row of data ?? []) {
      serverByKey.set(`${row.book_id}:${row.chapter}:${row.verse}`, row.updated_at as string);
    }
    for (const r of batch) {
      const serverUpdatedAt = serverByKey.get(`${r.bookId}:${r.chapter}:${r.verse}`);
      if (!serverUpdatedAt) continue;
      desc.store.markSynced(desc.keyOf(userId, r.bookId, r.chapter, r.verse), r.updatedAt, serverUpdatedAt);
    }
    pushed += batch.length;
  }
  return pushed;
}

/** Pull rows changed since the cursor, merge via LWW, advance the cursor per page. */
async function pullChanges<T extends SyncableRecord>(desc: CollectionDescriptor<T>, userId: string): Promise<number> {
  const meta = useSyncMetaStore.getState();
  let since = meta.getLastPulledAt(desc.name, userId) ?? EPOCH;
  let pulled = 0;

  for (;;) {
    const { data, error } = await supabase
      .from(desc.table)
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', since)
      .order('updated_at', { ascending: true })
      .limit(PULL_PAGE);
    if (error) throw error;

    const rows = (data ?? []) as RemoteRow[];
    if (rows.length === 0) break;

    desc.store.applyPulledMany(
      rows.map((row) => ({
        key: desc.keyOf(userId, row.book_id, row.chapter, row.verse),
        incoming: desc.fromRemote(row),
      }))
    );

    // Advance the cursor to the newest server timestamp seen (server time only).
    since = rows[rows.length - 1].updated_at;
    useSyncMetaStore.getState().setLastPulledAt(desc.name, userId, since);
    pulled += rows.length;

    if (rows.length < PULL_PAGE) break;
  }
  return pulled;
}
