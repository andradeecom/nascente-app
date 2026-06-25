import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { noteKey, type Note } from '@/types/study';
import type { TranslationId } from '@/types/bible';

/**
 * Local-first note storage, persisted on-device and keyed per user+verse so
 * multiple accounts on one device never see each other's notes (filter by the
 * current user id in selectors). Account-gated in the UI; a future account would
 * sync this to Supabase (DRAFT `notes` table), not replace it. Mirrors
 * `src/stores/highlights.ts`.
 */
type NoteInput = {
  userId: string;
  bookId: number;
  chapter: number;
  verse: number;
  body: string;
  translationId: TranslationId;
};

type NotesState = {
  byKey: Record<string, Note>;
  hasHydrated: boolean;
  setNote: (input: NoteInput) => void;
  removeNote: (userId: string, bookId: number, chapter: number, verse: number) => void;
  setHasHydrated: (value: boolean) => void;
};

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      byKey: {},
      hasHydrated: false,
      setNote: ({ userId, bookId, chapter, verse, body, translationId }) =>
        set((state) => {
          const key = noteKey(userId, bookId, chapter, verse);
          const existing = state.byKey[key];
          const now = new Date().toISOString();
          const next: Note = {
            userId,
            bookId,
            chapter,
            verse,
            body,
            translationId,
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
          };
          return { byKey: { ...state.byKey, [key]: next } };
        }),
      removeNote: (userId, bookId, chapter, verse) =>
        set((state) => {
          const key = noteKey(userId, bookId, chapter, verse);
          if (!state.byKey[key]) return state;
          const next = { ...state.byKey };
          delete next[key];
          return { byKey: next };
        }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'nascente-notes',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ byKey }) => ({ byKey }),
      onRehydrateStorage: () => (state, error) => {
        if (!error) state?.setHasHydrated(true);
      },
    }
  )
);
