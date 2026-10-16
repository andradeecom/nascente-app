import {
  applyPulledRow,
  hardDeleteAllForUser,
  markRowSynced,
  migrateSyncMeta,
  pruneTombstones,
  softDeleteAllForUser,
  TOMBSTONE_TTL_DAYS,
} from '../store-helpers';
import type { SyncableRecord } from '../types';

/**
 * The LWW merge rules for the study collections (highlights/bookmarks/notes).
 * These five helpers are the only place the conflict-resolution policy lives, and
 * getting one wrong silently destroys user data rather than throwing — so the
 * rules are pinned here as executable specs, including the tie-break.
 */

type TestRecord = SyncableRecord & { body: string };

const KEY = 'user-1:43:3:16';

function record(overrides: Partial<TestRecord> = {}): TestRecord {
  return {
    userId: 'user-1',
    bookId: 43,
    chapter: 3,
    verse: 16,
    translationId: 'bibliaLivre' as TestRecord['translationId'],
    body: 'local',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    dirty: false,
    syncedAt: null,
    ...overrides,
  };
}

describe('applyPulledRow', () => {
  it('accepts an incoming row that is strictly newer', () => {
    const byKey = { [KEY]: record({ body: 'local', updatedAt: '2026-01-01T00:00:00.000Z' }) };
    const incoming = record({ body: 'remote', updatedAt: '2026-01-02T00:00:00.000Z' });

    const next = applyPulledRow(byKey, KEY, incoming);

    expect(next[KEY].body).toBe('remote');
  });

  it('keeps the local row when it is strictly newer', () => {
    const byKey = { [KEY]: record({ body: 'local', updatedAt: '2026-01-03T00:00:00.000Z' }) };
    const incoming = record({ body: 'remote', updatedAt: '2026-01-02T00:00:00.000Z' });

    expect(applyPulledRow(byKey, KEY, incoming)).toBe(byKey); // same reference — no change
  });

  it('keeps the LOCAL row on an exact updatedAt tie', () => {
    // Ties matter: push runs before pull, so our own just-pushed rows echo back
    // with an identical `updated_at`. Local-wins makes that echo a no-op instead
    // of a needless re-render/flicker. If this flips, `collection.ts`'s
    // push-before-pull ordering comment stops being true.
    const byKey = { [KEY]: record({ body: 'local', updatedAt: '2026-01-02T00:00:00.000Z' }) };
    const incoming = record({ body: 'remote', updatedAt: '2026-01-02T00:00:00.000Z' });

    expect(applyPulledRow(byKey, KEY, incoming)).toBe(byKey);
  });

  it('inserts a row that does not exist locally', () => {
    const incoming = record({ body: 'remote' });

    expect(applyPulledRow({}, KEY, incoming)[KEY]).toMatchObject({ body: 'remote', dirty: false });
  });

  it('never marks a pulled row dirty, even if the incoming row claims to be', () => {
    // Pulled rows are by definition already on the server. A `dirty: true` leaking
    // through here would re-push it forever.
    const incoming = record({ updatedAt: '2026-01-05T00:00:00.000Z', dirty: true });

    expect(applyPulledRow({}, KEY, incoming)[KEY].dirty).toBe(false);
  });

  it('applies a newer remote tombstone over a live local row (delete wins)', () => {
    const byKey = { [KEY]: record({ body: 'local', updatedAt: '2026-01-01T00:00:00.000Z' }) };
    const incoming = record({ updatedAt: '2026-01-02T00:00:00.000Z', deletedAt: '2026-01-02T00:00:00.000Z' });

    expect(applyPulledRow(byKey, KEY, incoming)[KEY].deletedAt).toBe('2026-01-02T00:00:00.000Z');
  });

  it('resurrects a local tombstone when the remote write is newer', () => {
    // The "newest write wins" rule has to cover un-deleting too: a write always
    // clears `deletedAt`, so a later edit on another device must bring the row back.
    const byKey = { [KEY]: record({ updatedAt: '2026-01-01T00:00:00.000Z', deletedAt: '2026-01-01T00:00:00.000Z' }) };
    const incoming = record({ body: 'revived', updatedAt: '2026-01-02T00:00:00.000Z', deletedAt: null });

    const next = applyPulledRow(byKey, KEY, incoming);

    expect(next[KEY]).toMatchObject({ body: 'revived', deletedAt: null });
  });

  it('keeps a newer local delete over an older remote edit', () => {
    const byKey = { [KEY]: record({ updatedAt: '2026-01-09T00:00:00.000Z', deletedAt: '2026-01-09T00:00:00.000Z' }) };
    const incoming = record({ body: 'stale edit', updatedAt: '2026-01-02T00:00:00.000Z' });

    expect(applyPulledRow(byKey, KEY, incoming)).toBe(byKey);
  });

  it('does not mutate the input map', () => {
    const original = record({ body: 'local', updatedAt: '2026-01-01T00:00:00.000Z' });
    const byKey = { [KEY]: original };

    applyPulledRow(byKey, KEY, record({ body: 'remote', updatedAt: '2026-01-02T00:00:00.000Z' }));

    expect(byKey[KEY]).toBe(original);
    expect(byKey[KEY].body).toBe('local');
  });
});

describe('markRowSynced', () => {
  it('clears dirty and re-anchors updatedAt to the server value', () => {
    // Re-anchoring is what neutralises client clock skew: a device running fast
    // would otherwise keep winning every future LWW comparison.
    const byKey = { [KEY]: record({ updatedAt: '2026-01-01T00:00:00.000Z', dirty: true }) };

    const next = markRowSynced(byKey, KEY, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:05.000Z');

    expect(next[KEY]).toMatchObject({ dirty: false, updatedAt: '2026-01-01T00:00:05.000Z' });
    expect(next[KEY].syncedAt).toEqual(expect.any(String));
  });

  it('keeps the row dirty when it was edited again mid-sync', () => {
    // The push snapshot's `updatedAt` no longer matches, so this write belongs to
    // a stale in-flight request; the newer local edit must survive to the next cycle.
    const byKey = { [KEY]: record({ body: 'edited during push', updatedAt: '2026-01-02T00:00:00.000Z', dirty: true }) };

    const next = markRowSynced(byKey, KEY, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:05.000Z');

    expect(next).toBe(byKey);
    expect(next[KEY]).toMatchObject({ dirty: true, updatedAt: '2026-01-02T00:00:00.000Z' });
  });

  it('no-ops for a key that is no longer present', () => {
    const byKey = {};
    expect(markRowSynced(byKey, KEY, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:05.000Z')).toBe(byKey);
  });
});

describe('migrateSyncMeta', () => {
  it('stamps legacy rows as dirty so the local-only corpus uploads on first sync', () => {
    // Every pre-sync bookmark looks like this: no `updatedAt`, no `dirty`.
    const legacy = { userId: 'user-1', bookId: 43, chapter: 3, verse: 16, createdAt: '2025-06-01T00:00:00.000Z' };
    const byKey = { [KEY]: legacy as unknown as TestRecord };

    const next = migrateSyncMeta(byKey);

    expect(next[KEY]).toMatchObject({
      updatedAt: '2025-06-01T00:00:00.000Z', // falls back to createdAt
      deletedAt: null,
      dirty: true,
      syncedAt: null,
    });
  });

  it('leaves already-migrated rows untouched and returns the same reference', () => {
    const byKey = { [KEY]: record({ dirty: false }) };
    expect(migrateSyncMeta(byKey)).toBe(byKey);
  });

  it('does not re-dirty a clean migrated row when another row needs migrating', () => {
    const clean = record({ dirty: false, updatedAt: '2026-01-01T00:00:00.000Z' });
    const legacy = { userId: 'user-1', bookId: 1, chapter: 1, verse: 1, createdAt: '2025-06-01T00:00:00.000Z' };
    const byKey = { [KEY]: clean, 'user-1:1:1:1': legacy as unknown as TestRecord };

    const next = migrateSyncMeta(byKey);

    expect(next[KEY]).toBe(clean);
    expect(next['user-1:1:1:1'].dirty).toBe(true);
  });
});

describe('softDeleteAllForUser', () => {
  it('tombstones every live row for the user rather than dropping them', () => {
    // A hard wipe would not propagate — the other device would just re-push its copy.
    const byKey = {
      a: record({ userId: 'user-1' }),
      b: record({ userId: 'user-1', bookId: 1 }),
    };

    const next = softDeleteAllForUser(byKey, 'user-1');

    for (const row of Object.values(next)) {
      expect(row.deletedAt).toEqual(expect.any(String));
      expect(row.dirty).toBe(true);
      expect(row.updatedAt).toBe(row.deletedAt); // stamped together
    }
  });

  it('leaves other users rows untouched', () => {
    const otherUser = record({ userId: 'user-2' });
    const byKey = { a: record({ userId: 'user-1' }), b: otherUser };

    const next = softDeleteAllForUser(byKey, 'user-1');

    expect(next.b).toBe(otherUser);
    expect(next.a.deletedAt).toEqual(expect.any(String));
  });

  it('does not re-stamp existing tombstones', () => {
    const alreadyDeleted = record({ deletedAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' });
    const byKey = { a: alreadyDeleted };

    expect(softDeleteAllForUser(byKey, 'user-1')).toBe(byKey);
  });

  it('returns the same reference when the user has no live rows', () => {
    const byKey = { a: record({ userId: 'user-2' }) };
    expect(softDeleteAllForUser(byKey, 'user-1')).toBe(byKey);
  });
});

describe('pruneTombstones', () => {
  const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

  it('drops clean tombstones older than the TTL', () => {
    const byKey = { a: record({ deletedAt: daysAgo(TOMBSTONE_TTL_DAYS + 1), dirty: false }) };

    expect(pruneTombstones(byKey)).toEqual({});
  });

  it('keeps clean tombstones inside the TTL', () => {
    // Still needed for LWW: dropping it early would let another device's stale
    // pre-delete copy pull back in and resurrect the row.
    const byKey = { a: record({ deletedAt: daysAgo(TOMBSTONE_TTL_DAYS - 1), dirty: false }) };

    expect(pruneTombstones(byKey)).toBe(byKey);
  });

  it('never drops a dirty tombstone, however old', () => {
    // An un-pushed delete is the one thing that must survive — dropping it means
    // the delete never reaches the server and the row comes back on next pull.
    const byKey = { a: record({ deletedAt: daysAgo(TOMBSTONE_TTL_DAYS * 10), dirty: true }) };

    expect(pruneTombstones(byKey)).toBe(byKey);
  });

  it('leaves live rows alone regardless of age', () => {
    const byKey = { a: record({ deletedAt: null, createdAt: daysAgo(9999) }) };
    expect(pruneTombstones(byKey)).toBe(byKey);
  });

  it('honours a custom ttl', () => {
    const byKey = { a: record({ deletedAt: daysAgo(5), dirty: false }) };

    expect(pruneTombstones(byKey, 1)).toEqual({});
    expect(pruneTombstones(byKey, 30)).toBe(byKey);
  });

  it('defaults to the 90-day window that mirrors the server purge cron', () => {
    expect(TOMBSTONE_TTL_DAYS).toBe(90);
  });
});

describe('hardDeleteAllForUser', () => {
  it('drops every row for the user, tombstones included', () => {
    // The account-deletion counterpart to softDeleteAllForUser: once the account
    // is gone there is nothing to sync to, so leaving tombstones would strand
    // that user's rows on the device forever.
    const byKey = {
      a: record({ userId: 'user-1' }),
      b: record({ userId: 'user-1', bookId: 1, deletedAt: '2026-01-01T00:00:00.000Z' }),
    };

    expect(hardDeleteAllForUser(byKey, 'user-1')).toEqual({});
  });

  it('leaves other users rows untouched', () => {
    const otherUser = record({ userId: 'user-2' });
    const byKey = { a: record({ userId: 'user-1' }), b: otherUser };

    const next = hardDeleteAllForUser(byKey, 'user-1');

    expect(Object.keys(next)).toEqual(['b']);
    expect(next.b).toBe(otherUser);
  });

  it('returns the same reference when nothing matched (no needless re-render)', () => {
    const byKey = { a: record({ userId: 'user-2' }) };

    expect(hardDeleteAllForUser(byKey, 'user-1')).toBe(byKey);
  });
});
