import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { highlightKey, type Highlight, type HighlightColor } from '@/types/study';
import type { TranslationId } from '@/types/bible';

import { applyPulledRow, markRowSynced, migrateSyncMeta } from '@/services/sync/store-helpers';

/**
 * Local-first highlight storage, persisted on-device and keyed per user+verse so
 * multiple accounts on one device never see each other's highlights (filter by
 * the current user id in selectors). The feature itself is gated to signed-in
 * users in the UI. Changes sync to Supabase (`highlights` table) via
 * `src/services/sync/`: `remove` is a soft-delete tombstone, writes mark the row
 * `dirty`, and the engine reconciles via the `applyPulled`/`markSynced` actions.
 */
type HighlightInput = {
  userId: string;
  bookId: number;
  chapter: number;
  verse: number;
  color: HighlightColor;
  translationId: TranslationId;
};

type HighlightsState = {
  byKey: Record<string, Highlight>;
  hasHydrated: boolean;
  setHighlight: (input: HighlightInput) => void;
  removeHighlight: (userId: string, bookId: number, chapter: number, verse: number) => void;
  setHasHydrated: (value: boolean) => void;
  // Sync engine seams (src/services/sync). Never set `dirty`.
  applyPulled: (key: string, incoming: Highlight) => void;
  applyPulledMany: (rows: { key: string; incoming: Highlight }[]) => void;
  markSynced: (key: string, pushedUpdatedAt: string, serverUpdatedAt: string) => void;
};

export const useHighlightsStore = create<HighlightsState>()(
  persist(
    (set) => ({
      byKey: {},
      hasHydrated: false,
      setHighlight: ({ userId, bookId, chapter, verse, color, translationId }) =>
        set((state) => {
          const key = highlightKey(userId, bookId, chapter, verse);
          const existing = state.byKey[key];
          const now = new Date().toISOString();
          const next: Highlight = {
            userId,
            bookId,
            chapter,
            verse,
            color,
            translationId,
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
            deletedAt: null, // writing un-tombstones
            dirty: true,
            syncedAt: existing?.syncedAt ?? null,
          };
          return { byKey: { ...state.byKey, [key]: next } };
        }),
      removeHighlight: (userId, bookId, chapter, verse) =>
        set((state) => {
          const key = highlightKey(userId, bookId, chapter, verse);
          const existing = state.byKey[key];
          if (!existing || existing.deletedAt) return state; // already gone/tombstoned
          const now = new Date().toISOString();
          // Soft delete: keep the row as a tombstone so the delete syncs across devices.
          const next: Highlight = { ...existing, deletedAt: now, updatedAt: now, dirty: true };
          return { byKey: { ...state.byKey, [key]: next } };
        }),
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
      name: 'nascente-highlights',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ byKey }) => ({ byKey }),
      onRehydrateStorage: () => (state, error) => {
        if (error || !state) return;
        // Backfill sync metadata on legacy rows so the existing local corpus
        // uploads on first sync (see src/services/sync/store-helpers).
        state.byKey = migrateSyncMeta(state.byKey);
        state.setHasHydrated(true);
      },
    }
  )
);
