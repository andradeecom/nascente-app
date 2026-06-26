import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Local-first reading activity, persisted on-device (no account needed). Powers
 * the Home stats: overall Bible progress (read chapters) and the daily streak
 * (days with any reading). When signed in it syncs to Supabase
 * (`user_reading_progress`) via `src/services/sync/reading-progress.ts` — pure
 * append-only set-union (read = always read, day = always active), so there are
 * no tombstones, no LWW, no per-row timestamps. The store is **device-global**
 * (not per-user): a guest's accumulated progress unions up to the account on
 * sign-in ("sync & never lose it"). The store stays the source of truth.
 *
 * Chapters are keyed translation-independently as `${bookId}:${chapter}` so
 * progress reflects the canon, not which translation was read.
 */
function chapterKey(bookId: number, chapter: number): string {
  return `${bookId}:${chapter}`;
}

/** Local-day key (YYYY-MM-DD in device time) for streak bookkeeping. */
function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

type ReadingProgressState = {
  /** Set of `${bookId}:${chapter}` the user has read. */
  readChapters: Record<string, true>;
  /** Set of `YYYY-MM-DD` days with any reading activity. */
  readDays: Record<string, true>;
  hasHydrated: boolean;
  markChapterRead: (bookId: number, chapter: number) => void;
  setHasHydrated: (value: boolean) => void;
  /**
   * Union pulled remote progress into the local sets (sync engine seam). Never
   * removes — append-only. No-op (same reference) when nothing is new.
   */
  mergeRemote: (chapters: string[], days: string[]) => void;
};

export const useReadingProgressStore = create<ReadingProgressState>()(
  persist(
    (set, get) => ({
      readChapters: {},
      readDays: {},
      hasHydrated: false,
      markChapterRead: (bookId, chapter) => {
        const key = chapterKey(bookId, chapter);
        const today = dayKey(new Date());
        const { readChapters, readDays } = get();
        // Skip the write (and re-render) when nothing changes.
        if (readChapters[key] && readDays[today]) return;
        set({
          readChapters: readChapters[key] ? readChapters : { ...readChapters, [key]: true },
          readDays: readDays[today] ? readDays : { ...readDays, [today]: true },
        });
      },
      setHasHydrated: (value) => set({ hasHydrated: value }),
      mergeRemote: (chapters, days) => {
        const { readChapters, readDays } = get();
        let nextChapters = readChapters;
        let chaptersChanged = false;
        for (const c of chapters) {
          if (!nextChapters[c]) {
            if (!chaptersChanged) nextChapters = { ...nextChapters };
            nextChapters[c] = true;
            chaptersChanged = true;
          }
        }
        let nextDays = readDays;
        let daysChanged = false;
        for (const d of days) {
          if (!nextDays[d]) {
            if (!daysChanged) nextDays = { ...nextDays };
            nextDays[d] = true;
            daysChanged = true;
          }
        }
        if (!chaptersChanged && !daysChanged) return; // nothing new → no re-render
        set({ readChapters: nextChapters, readDays: nextDays });
      },
    }),
    {
      name: 'nascente-reading-progress',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ readChapters, readDays }) => ({ readChapters, readDays }),
      onRehydrateStorage: () => (state, error) => {
        if (!error) state?.setHasHydrated(true);
      },
    }
  )
);

/**
 * Current daily streak: consecutive days with reading ending today (or yesterday,
 * so it doesn't read 0 until a full day is actually missed).
 */
export function computeStreak(readDays: Record<string, true>): number {
  const has = (d: Date) => readDays[dayKey(d)] === true;

  const cursor = new Date();
  if (!has(cursor)) {
    cursor.setDate(cursor.getDate() - 1);
    if (!has(cursor)) return 0; // nothing today or yesterday → no active streak
  }

  let streak = 0;
  while (has(cursor)) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
