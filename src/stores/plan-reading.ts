import { create } from 'zustand';

/**
 * Ephemeral context for "reading a plan day in the Reader". Set when a day is
 * opened from Plan detail; the Reader uses it to offer "finish the day's reading"
 * at the end of the day's last chapter, which marks the day complete.
 *
 * In-memory only (not persisted) — a reading session shouldn't outlive the app
 * launch or silently complete a day the user abandoned days ago.
 */
export type PlanReadingSession = {
  userPlanId: string;
  planId: string;
  day: number;
  totalDays: number;
  bookId: number;
  /** Last chapter of the day's lead reading — where "finished" is offered. */
  lastChapter: number;
};

type PlanReadingState = {
  session: PlanReadingSession | null;
  startSession: (session: PlanReadingSession) => void;
  clearSession: () => void;
};

export const usePlanReadingStore = create<PlanReadingState>((set) => ({
  session: null,
  startSession: (session) => set({ session }),
  clearSession: () => set({ session: null }),
}));
