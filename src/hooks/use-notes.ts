import { useCallback, useMemo } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useNotesStore } from '@/stores/notes';
import type { Note } from '@/types/study';
import type { TranslationId } from '@/types/bible';

/** All notes belonging to the signed-in user (empty for guests). */
export function useCurrentUserNotes(): Note[] {
  const userId = useAuthStore((s) => s.user?.id);
  const byKey = useNotesStore((s) => s.byKey);
  return useMemo(
    () => (userId ? Object.values(byKey).filter((n) => n.userId === userId && !n.deletedAt) : []),
    [byKey, userId]
  );
}

/** verse → note map for one chapter, so the action sheet shows add vs. edit. */
export function useChapterNotes(bookId: number, chapter: number): Record<number, Note> {
  const notes = useCurrentUserNotes();
  return useMemo(() => {
    const map: Record<number, Note> = {};
    for (const n of notes) {
      if (n.bookId === bookId && n.chapter === chapter) map[n.verse] = n;
    }
    return map;
  }, [notes, bookId, chapter]);
}

/** Add/update or remove a note for the current user (no-ops for guests). */
export function useNoteActions(translationId: TranslationId) {
  const userId = useAuthStore((s) => s.user?.id);
  const set = useNotesStore((s) => s.setNote);
  const remove = useNotesStore((s) => s.removeNote);
  const clearAll = useNotesStore((s) => s.clearAllNotes);

  const setNote = useCallback(
    (bookId: number, chapter: number, verse: number, body: string) => {
      if (!userId) return;
      set({ userId, bookId, chapter, verse, body, translationId });
    },
    [userId, translationId, set]
  );

  const removeNote = useCallback(
    (bookId: number, chapter: number, verse: number) => {
      if (!userId) return;
      remove(userId, bookId, chapter, verse);
    },
    [userId, remove]
  );

  const clearAllNotes = useCallback(() => {
    if (!userId) return;
    clearAll(userId);
  }, [userId, clearAll]);

  return { setNote, removeNote, clearAllNotes, canNote: userId != null };
}
