import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type TranslationId, defaultTranslationForLocale } from '@/types/bible';

type ReaderState = {
  translationId: TranslationId;
  bookId: number;
  chapter: number;
  setTranslation: (id: TranslationId) => void;
  setBook: (bookId: number) => void;
  setChapter: (chapter: number) => void;
  setPosition: (bookId: number, chapter: number) => void;
};

export const useReaderStore = create<ReaderState>()(
  persist(
    (set) => ({
      translationId: defaultTranslationForLocale('pt'),
      bookId: 1,
      chapter: 1,

      setTranslation: (translationId: TranslationId) => set({ translationId, bookId: 1, chapter: 1 }),
      setBook: (bookId: number) => set({ bookId, chapter: 1 }),
      setChapter: (chapter: number) => set({ chapter }),
      setPosition: (bookId: number, chapter: number) => set({ bookId, chapter }),
    }),
    {
      name: 'nascente-reader',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
