import { useCallback, useMemo } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useHighlightsStore } from '@/stores/highlights';
import type { Highlight, HighlightColor } from '@/types/study';
import type { TranslationId } from '@/types/bible';

/** All highlights belonging to the signed-in user (empty for guests). */
export function useCurrentUserHighlights(): Highlight[] {
  const userId = useAuthStore((s) => s.user?.id);
  const byKey = useHighlightsStore((s) => s.byKey);
  return useMemo(() => (userId ? Object.values(byKey).filter((h) => h.userId === userId) : []), [byKey, userId]);
}

/** verse → color map for one chapter, for fast lookup while rendering the Reader. */
export function useChapterHighlights(bookId: number, chapter: number): Record<number, HighlightColor> {
  const highlights = useCurrentUserHighlights();
  return useMemo(() => {
    const map: Record<number, HighlightColor> = {};
    for (const h of highlights) {
      if (h.bookId === bookId && h.chapter === chapter) map[h.verse] = h.color;
    }
    return map;
  }, [highlights, bookId, chapter]);
}

/** Add/update or remove a highlight for the current user (no-op for guests). */
export function useHighlightActions(translationId: TranslationId) {
  const userId = useAuthStore((s) => s.user?.id);
  const setHL = useHighlightsStore((s) => s.setHighlight);
  const removeHL = useHighlightsStore((s) => s.removeHighlight);

  const setHighlight = useCallback(
    (bookId: number, chapter: number, verse: number, color: HighlightColor) => {
      if (!userId) return;
      setHL({ userId, bookId, chapter, verse, color, translationId });
    },
    [userId, translationId, setHL]
  );

  const removeHighlight = useCallback(
    (bookId: number, chapter: number, verse: number) => {
      if (!userId) return;
      removeHL(userId, bookId, chapter, verse);
    },
    [userId, removeHL]
  );

  return { setHighlight, removeHighlight, canHighlight: userId != null };
}
