import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { highlightKey, type Highlight, type HighlightColor } from '@/types/study';
import type { TranslationId } from '@/types/bible';

/**
 * Local-first highlight storage, persisted on-device and keyed per user+verse so
 * multiple accounts on one device never see each other's highlights (filter by
 * the current user id in selectors). The feature itself is gated to signed-in
 * users in the UI; a future account would sync this to Supabase (DRAFT
 * `highlights` table), not replace it.
 */
type HighlightInput = {
  userId: string;
  bookId: number;
  chapter: number;
  verse: number;
  color: HighlightColor;
  translationId: TranslationId;
};

type HighlightsState = {
  byKey: Record<string, Highlight>;
  hasHydrated: boolean;
  setHighlight: (input: HighlightInput) => void;
  removeHighlight: (userId: string, bookId: number, chapter: number, verse: number) => void;
  setHasHydrated: (value: boolean) => void;
};

export const useHighlightsStore = create<HighlightsState>()(
  persist(
    (set) => ({
      byKey: {},
      hasHydrated: false,
      setHighlight: ({ userId, bookId, chapter, verse, color, translationId }) =>
        set((state) => {
          const key = highlightKey(userId, bookId, chapter, verse);
          const existing = state.byKey[key];
          const now = new Date().toISOString();
          const next: Highlight = {
            userId,
            bookId,
            chapter,
            verse,
            color,
            translationId,
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
          };
          return { byKey: { ...state.byKey, [key]: next } };
        }),
      removeHighlight: (userId, bookId, chapter, verse) =>
        set((state) => {
          const key = highlightKey(userId, bookId, chapter, verse);
          if (!state.byKey[key]) return state;
          const next = { ...state.byKey };
          delete next[key];
          return { byKey: next };
        }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'nascente-highlights',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ byKey }) => ({ byKey }),
      onRehydrateStorage: () => (state, error) => {
        if (!error) state?.setHasHydrated(true);
      },
    }
  )
);
