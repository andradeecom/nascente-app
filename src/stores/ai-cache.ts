import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CachedAiResult } from '@/types/ai';

type AiCacheState = {
  byKey: Record<string, CachedAiResult>;
  hasHydrated: boolean;
  set: (key: string, result: CachedAiResult) => void;
  get: (key: string) => CachedAiResult | undefined;
  setHasHydrated: (value: boolean) => void;
};

export const useAiCacheStore = create<AiCacheState>()(
  persist(
    (set, get) => ({
      byKey: {},
      hasHydrated: false,
      set: (key, result) => set((state) => ({ byKey: { ...state.byKey, [key]: result } })),
      get: (key) => get().byKey[key],
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'nascente-ai-cache',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ byKey }) => ({ byKey }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
