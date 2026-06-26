import { supabase } from '@/lib/supabase';
import { useReadingProgressStore } from '@/stores/reading-progress';
import type { SyncResult } from './types';

const UPSERT_CHUNK = 500;

/**
 * Sync the reading-progress store (`readChapters` + `readDays`) for a user.
 * Unlike the study tools this is a **pure append-only set-union**: a chapter once
 * read / a day once active is never edited or removed, so there are no tombstones,
 * no last-write-wins, and no per-row timestamps — the table's PK
 * `(user_id, kind, value)` does the dedupe and `on conflict do nothing` makes the
 * push idempotent. The store is device-global, so a guest's accumulated progress
 * unions up to the account here on first sign-in.
 */
export async function syncReadingProgress(userId: string): Promise<SyncResult> {
  let pushed = 0;
  let pulled = 0;
  let errored = false;

  try {
    pushed = await pushProgress(userId);
  } catch {
    errored = true;
  }

  try {
    pulled = await pullProgress(userId);
  } catch {
    errored = true;
  }

  return { pushed, pulled, errored };
}

/** Insert every local chapter/day (insert-or-ignore — re-sending an existing row is a no-op). */
async function pushProgress(userId: string): Promise<number> {
  const { readChapters, readDays } = useReadingProgressStore.getState();
  const rows = [
    ...Object.keys(readChapters).map((value) => ({ user_id: userId, kind: 'chapter', value })),
    ...Object.keys(readDays).map((value) => ({ user_id: userId, kind: 'day', value })),
  ];
  if (rows.length === 0) return 0;

  let pushed = 0;
  for (let i = 0; i < rows.length; i += UPSERT_CHUNK) {
    const chunk = rows.slice(i, i + UPSERT_CHUNK);
    const { error } = await supabase
      .from('user_reading_progress')
      .upsert(chunk, { onConflict: 'user_id,kind,value', ignoreDuplicates: true });
    if (error) throw error;
    pushed += chunk.length;
  }
  return pushed;
}

/** Pull all rows for the user and union them into the local store (never removes). */
async function pullProgress(userId: string): Promise<number> {
  const { data, error } = await supabase.from('user_reading_progress').select('kind,value').eq('user_id', userId);
  if (error) throw error;

  const rows = data ?? [];
  const chapters = rows.filter((r) => r.kind === 'chapter').map((r) => r.value);
  const days = rows.filter((r) => r.kind === 'day').map((r) => r.value);
  useReadingProgressStore.getState().mergeRemote(chapters, days);
  return rows.length;
}
