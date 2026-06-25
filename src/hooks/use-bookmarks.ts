import { useCallback, useMemo } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useBookmarksStore } from '@/stores/bookmarks';
import type { Bookmark } from '@/types/study';
import type { TranslationId } from '@/types/bible';

/** All bookmarks belonging to the signed-in user (empty for guests). */
export function useCurrentUserBookmarks(): Bookmark[] {
  const userId = useAuthStore((s) => s.user?.id);
  const byKey = useBookmarksStore((s) => s.byKey);
  return useMemo(() => (userId ? Object.values(byKey).filter((b) => b.userId === userId) : []), [byKey, userId]);
}

/** Set of bookmarked verse numbers for one chapter, for fast lookup in the Reader. */
export function useChapterBookmarks(bookId: number, chapter: number): Set<number> {
  const bookmarks = useCurrentUserBookmarks();
  return useMemo(() => {
    const set = new Set<number>();
    for (const b of bookmarks) {
      if (b.bookId === bookId && b.chapter === chapter) set.add(b.verse);
    }
    return set;
  }, [bookmarks, bookId, chapter]);
}

/** Toggle a bookmark for the current user (no-op for guests). */
export function useBookmarkActions(translationId: TranslationId) {
  const userId = useAuthStore((s) => s.user?.id);
  const add = useBookmarksStore((s) => s.addBookmark);
  const remove = useBookmarksStore((s) => s.removeBookmark);
  const byKey = useBookmarksStore((s) => s.byKey);

  const isBookmarked = useCallback(
    (bookId: number, chapter: number, verse: number) =>
      userId != null && byKey[`${userId}:${bookId}:${chapter}:${verse}`] != null,
    [userId, byKey]
  );

  const toggleBookmark = useCallback(
    (bookId: number, chapter: number, verse: number) => {
      if (!userId) return;
      if (byKey[`${userId}:${bookId}:${chapter}:${verse}`]) {
        remove(userId, bookId, chapter, verse);
      } else {
        add({ userId, bookId, chapter, verse, translationId });
      }
    },
    [userId, translationId, byKey, add, remove]
  );

  return { toggleBookmark, isBookmarked, canBookmark: userId != null };
}
