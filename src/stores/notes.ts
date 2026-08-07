import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { noteKey, type Note } from '@/types/study';
import type { TranslationId } from '@/types/bible';
import {
  applyPulledRow,
  markRowSynced,
  migrateSyncMeta,
  pruneTombstones,
  hardDeleteAllForUser,
  softDeleteAllForUser,
} from '@/services/sync/store-helpers';

/**
 * Local-first note storage, persisted on-device and keyed per user+verse so
 * multiple accounts on one device never see each other's notes (filter by the
 * current user id in selectors). Account-gated in the UI. Changes sync to
 * Supabase (`notes` table) via `src/services/sync/`: `remove` is a soft-delete
 * tombstone, writes mark the row `dirty`, and the engine reconciles via the
 * `applyPulled`/`markSynced` actions. Mirrors `src/stores/highlights.ts`.
 */
type NoteInput = {
  userId: string;
  bookId: number;
  chapter: number;
  verse: number;
  body: string;
  translationId: TranslationId;
};

type NotesState = {
  byKey: Record<string, Note>;
  hasHydrated: boolean;
  setNote: (input: NoteInput) => void;
  removeNote: (userId: string, bookId: number, chapter: number, verse: number) => void;
  /** Soft-delete every note for the user (bulk tombstone; the delete syncs). */
  clearAllNotes: (userId: string) => void;
  /** Hard-remove every row for the user (tombstones included) — account deletion only. */
  purgeUser: (userId: string) => void;
  setHasHydrated: (value: boolean) => void;
  // Sync engine seams (src/services/sync). Never set `dirty`.
  applyPulled: (key: string, incoming: Note) => void;
  applyPulledMany: (rows: { key: string; incoming: Note }[]) => void;
  markSynced: (key: string, pushedUpdatedAt: string, serverUpdatedAt: string) => void;
};

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      byKey: {},
      hasHydrated: false,
      setNote: ({ userId, bookId, chapter, verse, body, translationId }) =>
        set((state) => {
          const key = noteKey(userId, bookId, chapter, verse);
          const existing = state.byKey[key];
          const now = new Date().toISOString();
          const next: Note = {
            userId,
            bookId,
            chapter,
            verse,
            body,
            translationId,
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
            deletedAt: null, // writing un-tombstones
            dirty: true,
            syncedAt: existing?.syncedAt ?? null,
          };
          return { byKey: { ...state.byKey, [key]: next } };
        }),
      removeNote: (userId, bookId, chapter, verse) =>
        set((state) => {
          const key = noteKey(userId, bookId, chapter, verse);
          const existing = state.byKey[key];
          if (!existing || existing.deletedAt) return state;
          const now = new Date().toISOString();
          // Soft delete: keep the row as a tombstone so the delete syncs across devices.
          const next: Note = { ...existing, deletedAt: now, updatedAt: now, dirty: true };
          return { byKey: { ...state.byKey, [key]: next } };
        }),
      clearAllNotes: (userId) => set((state) => ({ byKey: softDeleteAllForUser(state.byKey, userId) })),
      purgeUser: (userId) => set((state) => ({ byKey: hardDeleteAllForUser(state.byKey, userId) })),
      setHasHydrated: (value) => set({ hasHydrated: value }),
      applyPulled: (key, incoming) => set((state) => ({ byKey: applyPulledRow(state.byKey, key, incoming) })),
      applyPulledMany: (rows) =>
        set((state) => {
          let byKey = state.byKey;
          for (const { key, incoming } of rows) byKey = applyPulledRow(byKey, key, incoming);
          return { byKey };
        }),
      markSynced: (key, pushedUpdatedAt, serverUpdatedAt) =>
        set((state) => ({ byKey: markRowSynced(state.byKey, key, pushedUpdatedAt, serverUpdatedAt) })),
    }),
    {
      name: 'nascente-notes',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ byKey }) => ({ byKey }),
      onRehydrateStorage: () => (state, error) => {
        if (error || !state) return;
        state.byKey = pruneTombstones(migrateSyncMeta(state.byKey));
        state.setHasHydrated(true);
      },
    }
  )
);
