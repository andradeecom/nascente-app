import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type OnboardingState = {
  hasCompleted: boolean;
  hasHydrated: boolean;
  complete: () => void;
  reset: () => void;
  setHasHydrated: (value: boolean) => void;
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompleted: false,
      hasHydrated: false,
      complete: () => set({ hasCompleted: true }),
      reset: () => set({ hasCompleted: false }),
      setHasHydrated: (value: boolean) => set({ hasHydrated: value }),
    }),
    {
      name: 'nascente-onboarding',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state, error) => {
        if (!error) {
          state?.setHasHydrated(true);
        }
      },
    }
  )
);
