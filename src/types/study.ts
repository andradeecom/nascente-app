import type { TranslationId } from '@/types/bible';

/**
 * Highlight palette — keys match `theme.highlights` (src/theme/colors.ts), so a
 * `HighlightColor` maps directly to a swatch color at render time.
 */
export const HIGHLIGHT_COLORS = ['yellow', 'green', 'blue', 'pink', 'purple', 'orange'] as const;
export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number];

/**
 * Per-row sync metadata mirrored on every locally-stored study record so the
 * on-device store can sync to Supabase (see `src/services/sync/`). `updatedAt`
 * is the last-write-wins key (server-authoritative once a row has round-tripped);
 * `deletedAt` is a soft-delete tombstone (set instead of dropping the row, so a
 * delete on one device propagates everywhere); `dirty` marks a local change not
 * yet pushed; `syncedAt` records the last successful push (debug/auditing).
 */
export type SyncMeta = {
  updatedAt: string;
  deletedAt?: string | null;
  dirty?: boolean;
  syncedAt?: string | null;
};

/**
 * A verse highlight. Stored locally per user (local-first; see
 * `src/stores/highlights.ts`). The verse reference (book/chapter/verse) is the
 * canonical identity — highlights render regardless of which translation is open.
 * `translationId` records where it was created. Mirrors the live `highlights`
 * table in `.docs/data-model.md`; synced via `src/services/sync/`.
 */
export type Highlight = {
  userId: string;
  bookId: number;
  chapter: number;
  verse: number;
  color: HighlightColor;
  translationId: TranslationId;
  createdAt: string;
} & SyncMeta;

/** Stable per-user, per-verse key (one highlight per verse per user). */
export function highlightKey(userId: string, bookId: number, chapter: number, verse: number): string {
  return `${userId}:${bookId}:${chapter}:${verse}`;
}

/**
 * A verse bookmark. Stored locally per user (local-first; see
 * `src/stores/bookmarks.ts`). Like `Highlight`, the verse reference is the
 * canonical identity and `translationId` records where it was created. Mirrors
 * the live `bookmarks` table in `.docs/data-model.md` (a plain toggle, no body);
 * synced via `src/services/sync/`.
 */
export type Bookmark = {
  userId: string;
  bookId: number;
  chapter: number;
  verse: number;
  translationId: TranslationId;
  createdAt: string;
} & SyncMeta;

/** Stable per-user, per-verse key (one bookmark per verse per user). */
export function bookmarkKey(userId: string, bookId: number, chapter: number, verse: number): string {
  return `${userId}:${bookId}:${chapter}:${verse}`;
}

/**
 * A verse note. Stored locally per user (local-first; see `src/stores/notes.ts`).
 * One note per verse per user; `body` is the free text. Mirrors the live `notes`
 * table in `.docs/data-model.md`; synced via `src/services/sync/`.
 */
export type Note = {
  userId: string;
  bookId: number;
  chapter: number;
  verse: number;
  body: string;
  translationId: TranslationId;
  createdAt: string;
} & SyncMeta;

/** Stable per-user, per-verse key (one note per verse per user). */
export function noteKey(userId: string, bookId: number, chapter: number, verse: number): string {
  return `${userId}:${bookId}:${chapter}:${verse}`;
}
