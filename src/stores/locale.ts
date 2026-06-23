import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { i18n } from '@/i18n/i18n';

export const LOCALE_OPTIONS = ['pt', 'es', 'en'] as const;
export type LocaleName = (typeof LOCALE_OPTIONS)[number];

type LocaleState = {
  locale: LocaleName | null;
  setLocale: (locale: LocaleName) => void;
};

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: null,
      setLocale: (locale: LocaleName) => {
        set({ locale });
        i18n.locale = locale;
      },
    }),
    {
      name: 'nascente-locale',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.locale) {
          i18n.locale = state.locale;
        }
      },
    }
  )
);
