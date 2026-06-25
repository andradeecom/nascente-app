import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bookmarkKey, type Bookmark } from '@/types/study';
import type { TranslationId } from '@/types/bible';

/**
 * Local-first bookmark storage, persisted on-device and keyed per user+verse so
 * multiple accounts on one device never see each other's bookmarks (filter by
 * the current user id in selectors). Account-gated in the UI; a future account
 * would sync this to Supabase (DRAFT `bookmarks` table), not replace it. Mirrors
 * `src/stores/highlights.ts`.
 */
type BookmarkInput = {
  userId: string;
  bookId: number;
  chapter: number;
  verse: number;
  translationId: TranslationId;
};

type BookmarksState = {
  byKey: Record<string, Bookmark>;
  hasHydrated: boolean;
  addBookmark: (input: BookmarkInput) => void;
  removeBookmark: (userId: string, bookId: number, chapter: number, verse: number) => void;
  setHasHydrated: (value: boolean) => void;
};

export const useBookmarksStore = create<BookmarksState>()(
  persist(
    (set) => ({
      byKey: {},
      hasHydrated: false,
      addBookmark: ({ userId, bookId, chapter, verse, translationId }) =>
        set((state) => {
          const key = bookmarkKey(userId, bookId, chapter, verse);
          if (state.byKey[key]) return state; // idempotent
          const next: Bookmark = {
            userId,
            bookId,
            chapter,
            verse,
            translationId,
            createdAt: new Date().toISOString(),
          };
          return { byKey: { ...state.byKey, [key]: next } };
        }),
      removeBookmark: (userId, bookId, chapter, verse) =>
        set((state) => {
          const key = bookmarkKey(userId, bookId, chapter, verse);
          if (!state.byKey[key]) return state;
          const next = { ...state.byKey };
          delete next[key];
          return { byKey: next };
        }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'nascente-bookmarks',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ byKey }) => ({ byKey }),
      onRehydrateStorage: () => (state, error) => {
        if (!error) state?.setHasHydrated(true);
      },
    }
  )
);
