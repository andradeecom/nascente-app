import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bookmarkKey, type Bookmark } from '@/types/study';
import type { TranslationId } from '@/types/bible';
import { applyPulledRow, markRowSynced, migrateSyncMeta } from '@/services/sync/store-helpers';

/**
 * Local-first bookmark storage, persisted on-device and keyed per user+verse so
 * multiple accounts on one device never see each other's bookmarks (filter by
 * the current user id in selectors). Account-gated in the UI. Changes sync to
 * Supabase (`bookmarks` table) via `src/services/sync/`: `remove` is a
 * soft-delete tombstone, writes mark the row `dirty`, and re-adding a tombstoned
 * verse revives it. Mirrors `src/stores/highlights.ts`.
 */
type BookmarkInput = {
  userId: string;
  bookId: number;
  chapter: number;
  verse: number;
  translationId: TranslationId;
};

type BookmarksState = {
  byKey: Record<string, Bookmark>;
  hasHydrated: boolean;
  addBookmark: (input: BookmarkInput) => void;
  removeBookmark: (userId: string, bookId: number, chapter: number, verse: number) => void;
  setHasHydrated: (value: boolean) => void;
  // Sync engine seams (src/services/sync). Never set `dirty`.
  applyPulled: (key: string, incoming: Bookmark) => void;
  applyPulledMany: (rows: { key: string; incoming: Bookmark }[]) => void;
  markSynced: (key: string, pushedUpdatedAt: string, serverUpdatedAt: string) => void;
};

export const useBookmarksStore = create<BookmarksState>()(
  persist(
    (set) => ({
      byKey: {},
      hasHydrated: false,
      addBookmark: ({ userId, bookId, chapter, verse, translationId }) =>
        set((state) => {
          const key = bookmarkKey(userId, bookId, chapter, verse);
          const existing = state.byKey[key];
          if (existing && !existing.deletedAt) return state; // idempotent on a live row
          const now = new Date().toISOString();
          const next: Bookmark = {
            userId,
            bookId,
            chapter,
            verse,
            translationId,
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
            deletedAt: null, // re-adding revives a tombstoned bookmark
            dirty: true,
            syncedAt: existing?.syncedAt ?? null,
          };
          return { byKey: { ...state.byKey, [key]: next } };
        }),
      removeBookmark: (userId, bookId, chapter, verse) =>
        set((state) => {
          const key = bookmarkKey(userId, bookId, chapter, verse);
          const existing = state.byKey[key];
          if (!existing || existing.deletedAt) return state;
          const now = new Date().toISOString();
          // Soft delete: keep the row as a tombstone so the delete syncs across devices.
          const next: Bookmark = { ...existing, deletedAt: now, updatedAt: now, dirty: true };
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
      name: 'nascente-bookmarks',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ byKey }) => ({ byKey }),
      onRehydrateStorage: () => (state, error) => {
        if (error || !state) return;
        state.byKey = migrateSyncMeta(state.byKey);
        state.setHasHydrated(true);
      },
    }
  )
);
