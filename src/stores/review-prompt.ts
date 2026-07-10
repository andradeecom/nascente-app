import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Tracks whether we've already asked the OS for an in-app store-review prompt
 * (device-global, not per-user — the OS itself also throttles/no-ops repeat
 * requests, but we still gate client-side so we don't call it on every
 * high-satisfaction moment for the same install). See `src/lib/review-prompt.ts`.
 */
type ReviewPromptState = {
  hasRequested: boolean;
  markRequested: () => void;
};

export const useReviewPromptStore = create<ReviewPromptState>()(
  persist(
    (set) => ({
      hasRequested: false,
      markRequested: () => set({ hasRequested: true }),
    }),
    {
      name: 'nascente-review-prompt',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
