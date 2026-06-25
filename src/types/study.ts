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
