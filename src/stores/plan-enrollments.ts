import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { enrollmentKey, type LocalEnrollment, type UserPlanStatus } from '@/types/reading-plans';

/**
 * Local-first store of the user's plan enrollments (the source of truth for
 * "which plans am I doing"). Keyed per user+plan (`enrollmentKey`) — matches the
 * DB `UNIQUE (user_id, plan_id)`, so there is exactly one row per (user, plan)
 * and restarting an archived plan reuses the same row. The `id` is a
 * client-generated uuid so a plan can be started **offline**; it becomes the
 * server PK on push (`upsert onConflict: id`).
 *
 * `current_day` and `completed_at` are **derived** (never stored) — see the
 * derive helpers below. Synced with **status-merge** (not plain LWW): archived
 * is sticky-wins (a removal on one device propagates), `startedAt` is
 * earliest-wins, otherwise last-write-wins on `updatedAt`. See
 * `src/services/sync/reading-plans.ts`.
 */
type EnrollmentsState = {
  byKey: Record<string, LocalEnrollment>;
  hasHydrated: boolean;
  /** Start (or restart an archived) enrollment. Returns the row (caller needs its id). */
  start: (userId: string, planId: string) => LocalEnrollment;
  archive: (userId: string, planId: string) => void;
  markComplete: (userId: string, planId: string) => void;
  /** Hard-remove every enrollment for the user — account deletion only. */
  purgeUser: (userId: string) => void;
  setHasHydrated: (value: boolean) => void;
  // Sync engine seams (never set `dirty`).
  applyPulled: (key: string, incoming: LocalEnrollment) => void;
  applyPulledMany: (rows: { key: string; incoming: LocalEnrollment }[]) => void;
  markSynced: (key: string, pushedUpdatedAt: string, serverUpdatedAt: string) => void;
};

export const usePlanEnrollmentsStore = create<EnrollmentsState>()(
  persist(
    (set) => ({
      byKey: {},
      hasHydrated: false,
      start: (userId, planId) => {
        const key = enrollmentKey(userId, planId);
        const now = new Date().toISOString();
        const state = usePlanEnrollmentsStore.getState();
        const existing = state.byKey[key];
        // Restart of an archived/completed plan reuses the same row + id.
        const next: LocalEnrollment = existing
          ? { ...existing, status: 'active', startedAt: now, updatedAt: now, dirty: true }
          : {
              id: Crypto.randomUUID(),
              userId,
              planId,
              startedAt: now,
              createdAt: now,
              status: 'active',
              updatedAt: now,
              dirty: true,
              syncedAt: null,
            };
        set({ byKey: { ...state.byKey, [key]: next } });
        return next;
      },
      archive: (userId, planId) =>
        set((state) => {
          const key = enrollmentKey(userId, planId);
          const existing = state.byKey[key];
          if (!existing || existing.status === 'archived') return state;
          const now = new Date().toISOString();
          const next: LocalEnrollment = { ...existing, status: 'archived', updatedAt: now, dirty: true };
          return { byKey: { ...state.byKey, [key]: next } };
        }),
      markComplete: (userId, planId) =>
        set((state) => {
          const key = enrollmentKey(userId, planId);
          const existing = state.byKey[key];
          if (!existing || existing.status !== 'active') return state;
          const now = new Date().toISOString();
          const next: LocalEnrollment = { ...existing, status: 'completed', updatedAt: now, dirty: true };
          return { byKey: { ...state.byKey, [key]: next } };
        }),
      purgeUser: (userId) =>
        set((state) => {
          const next: Record<string, LocalEnrollment> = {};
          let changed = false;
          for (const [key, row] of Object.entries(state.byKey)) {
            if (row.userId === userId) {
              changed = true;
              continue;
            }
            next[key] = row;
          }
          return changed ? { byKey: next } : state;
        }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
      applyPulled: (key, incoming) => set((state) => ({ byKey: mergeEnrollment(state.byKey, key, incoming) })),
      applyPulledMany: (rows) =>
        set((state) => {
          let byKey = state.byKey;
          for (const { key, incoming } of rows) byKey = mergeEnrollment(byKey, key, incoming);
          return { byKey };
        }),
      markSynced: (key, pushedUpdatedAt, serverUpdatedAt) =>
        set((state) => {
          const row = state.byKey[key];
          if (!row) return state;
          if (row.updatedAt !== pushedUpdatedAt) return state; // edited again mid-sync → keep dirty
          return {
            byKey: {
              ...state.byKey,
              [key]: { ...row, dirty: false, updatedAt: serverUpdatedAt, syncedAt: new Date().toISOString() },
            },
          };
        }),
    }),
    {
      name: 'nascente-plan-enrollments',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ byKey }) => ({ byKey }),
      onRehydrateStorage: () => (state, error) => {
        if (!error) state?.setHasHydrated(true);
      },
    }
  )
);

/**
 * Status-merge of a pulled enrollment (§6.2): archived sticky-wins (a removal
 * propagates and never resurrects), `startedAt` earliest-wins, otherwise LWW on
 * `updatedAt`. If a local archive overrode an incoming active row, keep it
 * `dirty` so the archive re-pushes; otherwise the merged row is clean.
 */
function mergeEnrollment(
  byKey: Record<string, LocalEnrollment>,
  key: string,
  incoming: LocalEnrollment
): Record<string, LocalEnrollment> {
  const local = byKey[key];
  if (!local) return { ...byKey, [key]: { ...incoming, dirty: false } };

  const newer = incoming.updatedAt > local.updatedAt ? incoming : local;
  const archived = local.status === 'archived' || incoming.status === 'archived';
  const status: UserPlanStatus = archived ? 'archived' : newer.status;
  const startedAt = local.startedAt < incoming.startedAt ? local.startedAt : incoming.startedAt;
  // Our local archive won over an incoming active → re-push the archive.
  const dirty = archived && incoming.status !== 'archived';

  const merged: LocalEnrollment = { ...newer, status, startedAt, dirty, syncedAt: newer.syncedAt ?? null };
  // No-op when the merge produced an identical row (avoid needless re-render).
  if (
    local.status === merged.status &&
    local.startedAt === merged.startedAt &&
    local.updatedAt === merged.updatedAt &&
    !!local.dirty === !!merged.dirty
  ) {
    return byKey;
  }
  return { ...byKey, [key]: merged };
}

// ── Derived state (completions are authoritative; these are computed on read) ─

/** Lowest uncompleted day in `1..totalDays` (the "Próxima" pointer); totalDays if all done. */
export function deriveCurrentDay(completedDays: Set<number>, totalDays: number): number {
  for (let d = 1; d <= totalDays; d += 1) {
    if (!completedDays.has(d)) return d;
  }
  return totalDays;
}

/** archived (sticky) → completed (all days done) → active. */
export function deriveStatus(stored: LocalEnrollment, completedCount: number, totalDays: number): UserPlanStatus {
  if (stored.status === 'archived') return 'archived';
  if (totalDays > 0 && completedCount >= totalDays) return 'completed';
  return 'active';
}

/** 0–100 from completed days / total. */
export function deriveProgressPercent(completedCount: number, totalDays: number): number {
  return totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;
}
