import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UnistylesRuntime } from 'react-native-unistyles';

export const THEME_OPTIONS = ['light', 'sepia', 'dark'] as const;
export type ThemeName = (typeof THEME_OPTIONS)[number];

type ThemeState = {
  theme: ThemeName;
  hasHydrated: boolean;
  setTheme: (theme: ThemeName) => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      hasHydrated: false,
      setTheme: (theme: ThemeName) => {
        set({ theme });
        UnistylesRuntime.setTheme(theme);
      },
    }),
    {
      name: 'nascente-theme',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          UnistylesRuntime.setTheme(state.theme);
          state.hasHydrated = true;
        }
      },
    }
  )
);
