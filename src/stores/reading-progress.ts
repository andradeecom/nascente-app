import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Local-first reading activity, persisted on-device (no account needed). Powers
 * the Home stats: overall Bible progress (read chapters) and the daily streak
 * (days with any reading). A future account becomes "sync & never lose it"; this
 * store stays the source of truth on the device.
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
