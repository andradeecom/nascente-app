import { useHighlightsStore } from '@/stores/highlights';
import { useBookmarksStore } from '@/stores/bookmarks';
import { useNotesStore } from '@/stores/notes';
import { highlightKey, bookmarkKey, noteKey } from '@/types/study';
import type { Bookmark, Highlight, HighlightColor, Note } from '@/types/study';
import type { TranslationId } from '@/types/bible';
import type { CollectionDescriptor, RemoteRow } from './types';

/**
 * One descriptor per study collection, wiring its local store + Supabase table
 * to the generic engine. `toRemote` omits `updated_at` so the server trigger
 * stamps it authoritatively; `fromRemote` maps snake_case → the local record
 * with `dirty: false` (pulled rows are already on the server).
 */

export const highlightsSync: CollectionDescriptor<Highlight> = {
  name: 'highlights',
  table: 'highlights',
  keyOf: highlightKey,
  store: {
    getByKey: () => useHighlightsStore.getState().byKey,
    applyPulledMany: (rows) => useHighlightsStore.getState().applyPulledMany(rows),
    markSynced: (key, pushed, server) => useHighlightsStore.getState().markSynced(key, pushed, server),
  },
  toRemote: (h) => ({
    user_id: h.userId,
    book_id: h.bookId,
    chapter: h.chapter,
    verse: h.verse,
    color: h.color,
    translation: h.translationId,
    created_at: h.createdAt,
    deleted_at: h.deletedAt ?? null,
  }),
  fromRemote: (row: RemoteRow) => ({
    userId: row.user_id,
    bookId: row.book_id,
    chapter: row.chapter,
    verse: row.verse,
    color: row.color as HighlightColor,
    translationId: row.translation as TranslationId,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    dirty: false,
    syncedAt: null,
  }),
};

export const bookmarksSync: CollectionDescriptor<Bookmark> = {
  name: 'bookmarks',
  table: 'bookmarks',
  keyOf: bookmarkKey,
  store: {
    getByKey: () => useBookmarksStore.getState().byKey,
    applyPulledMany: (rows) => useBookmarksStore.getState().applyPulledMany(rows),
    markSynced: (key, pushed, server) => useBookmarksStore.getState().markSynced(key, pushed, server),
  },
  toRemote: (b) => ({
    user_id: b.userId,
    book_id: b.bookId,
    chapter: b.chapter,
    verse: b.verse,
    translation: b.translationId,
    created_at: b.createdAt,
    deleted_at: b.deletedAt ?? null,
  }),
  fromRemote: (row: RemoteRow) => ({
    userId: row.user_id,
    bookId: row.book_id,
    chapter: row.chapter,
    verse: row.verse,
    translationId: row.translation as TranslationId,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    dirty: false,
    syncedAt: null,
  }),
};

export const notesSync: CollectionDescriptor<Note> = {
  name: 'notes',
  table: 'notes',
  keyOf: noteKey,
  store: {
    getByKey: () => useNotesStore.getState().byKey,
    applyPulledMany: (rows) => useNotesStore.getState().applyPulledMany(rows),
    markSynced: (key, pushed, server) => useNotesStore.getState().markSynced(key, pushed, server),
  },
  toRemote: (n) => ({
    user_id: n.userId,
    book_id: n.bookId,
    chapter: n.chapter,
    verse: n.verse,
    body: n.body,
    translation: n.translationId,
    created_at: n.createdAt,
    deleted_at: n.deletedAt ?? null,
  }),
  fromRemote: (row: RemoteRow) => ({
    userId: row.user_id,
    bookId: row.book_id,
    chapter: row.chapter,
    verse: row.verse,
    body: row.body as string,
    translationId: row.translation as TranslationId,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    dirty: false,
    syncedAt: null,
  }),
};
