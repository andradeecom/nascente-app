import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { i18n } from '@/i18n/i18n';
import { Locales } from '@/types';

type LocaleState = {
  locale: Locales | null;
  setLocale: (locale: Locales) => void;
};

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'pt',
      setLocale: (locale: Locales) => {
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
