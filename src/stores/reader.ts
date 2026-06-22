import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type TranslationId, defaultTranslationForLocale } from '@/types/bible';

export type ReaderFontSize = 'small' | 'medium' | 'large' | 'xl';

type ReaderState = {
  translationId: TranslationId;
  bookId: number;
  chapter: number;
  fontSize: ReaderFontSize;
  setTranslation: (id: TranslationId) => void;
  setBook: (bookId: number) => void;
  setChapter: (chapter: number) => void;
  setPosition: (bookId: number, chapter: number) => void;
  setFontSize: (size: ReaderFontSize) => void;
};

export const useReaderStore = create<ReaderState>()(
  persist(
    (set) => ({
      translationId: defaultTranslationForLocale('pt'),
      bookId: 1,
      chapter: 1,
      fontSize: 'medium' as ReaderFontSize,

      setTranslation: (translationId: TranslationId) => set({ translationId, bookId: 1, chapter: 1 }),
      setBook: (bookId: number) => set({ bookId, chapter: 1 }),
      setChapter: (chapter: number) => set({ chapter }),
      setPosition: (bookId: number, chapter: number) => set({ bookId, chapter }),
      setFontSize: (fontSize: ReaderFontSize) => set({ fontSize }),
    }),
    {
      name: 'nascente-reader',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
