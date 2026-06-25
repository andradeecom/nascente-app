import type { TranslationId } from '@/types/bible';

/**
 * Highlight palette — keys match `theme.highlights` (src/theme/colors.ts), so a
 * `HighlightColor` maps directly to a swatch color at render time.
 */
export const HIGHLIGHT_COLORS = ['yellow', 'green', 'blue', 'pink', 'purple', 'orange'] as const;
export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number];

/**
 * A verse highlight. Stored locally per user (local-first; see
 * `src/stores/highlights.ts`). The verse reference (book/chapter/verse) is the
 * canonical identity — highlights render regardless of which translation is open.
 * `translationId` records where it was created. Mirrors the DRAFT `highlights`
 * table in `.docs/data-model.md` for the eventual sync.
 */
export type Highlight = {
  userId: string;
  bookId: number;
  chapter: number;
  verse: number;
  color: HighlightColor;
  translationId: TranslationId;
  createdAt: string;
  updatedAt: string;
};

/** Stable per-user, per-verse key (one highlight per verse per user). */
export function highlightKey(userId: string, bookId: number, chapter: number, verse: number): string {
  return `${userId}:${bookId}:${chapter}:${verse}`;
}

/**
 * A verse bookmark. Stored locally per user (local-first; see
 * `src/stores/bookmarks.ts`). Like `Highlight`, the verse reference is the
 * canonical identity and `translationId` records where it was created. Mirrors
 * the DRAFT `bookmarks` table in `.docs/data-model.md` (its `label` is unused in
 * V1 — bookmarks are a plain toggle).
 */
export type Bookmark = {
  userId: string;
  bookId: number;
  chapter: number;
  verse: number;
  translationId: TranslationId;
  createdAt: string;
};

/** Stable per-user, per-verse key (one bookmark per verse per user). */
export function bookmarkKey(userId: string, bookId: number, chapter: number, verse: number): string {
  return `${userId}:${bookId}:${chapter}:${verse}`;
}

/**
 * A verse note. Stored locally per user (local-first; see `src/stores/notes.ts`).
 * One note per verse per user; `body` is the free text. Mirrors the DRAFT `notes`
 * table in `.docs/data-model.md` for the eventual sync.
 */
export type Note = {
  userId: string;
  bookId: number;
  chapter: number;
  verse: number;
  body: string;
  translationId: TranslationId;
  createdAt: string;
  updatedAt: string;
};

/** Stable per-user, per-verse key (one note per verse per user). */
export function noteKey(userId: string, bookId: number, chapter: number, verse: number): string {
  return `${userId}:${bookId}:${chapter}:${verse}`;
}
