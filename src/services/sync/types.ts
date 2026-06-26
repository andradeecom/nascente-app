import type { TranslationId } from '@/types/bible';

/**
 * The shape every syncable study record shares: a per-user verse identity plus
 * the sync metadata (`SyncMeta`) carried by `Highlight` / `Bookmark` / `Note`.
 * The sync engine is generic over this — table-specific fields (color/body) ride
 * along in the concrete `T` and are handled by the descriptor mappers.
 */
export type SyncableRecord = {
  userId: string;
  bookId: number;
  chapter: number;
  verse: number;
  translationId: TranslationId;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  dirty?: boolean;
  syncedAt?: string | null;
};

/** A Supabase row from one of the three study tables (table-specific cols ride along). */
export type RemoteRow = {
  user_id: string;
  book_id: number;
  chapter: number;
  verse: number;
  translation: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
} & Record<string, unknown>;

/** The minimal store surface the engine drives (one per collection). */
export type CollectionStore<T extends SyncableRecord> = {
  getByKey: () => Record<string, T>;
  applyPulledMany: (rows: { key: string; incoming: T }[]) => void;
  markSynced: (key: string, pushedUpdatedAt: string, serverUpdatedAt: string) => void;
};

/** Wires a local store + its Supabase table together for the generic engine. */
export type CollectionDescriptor<T extends SyncableRecord> = {
  name: 'highlights' | 'bookmarks' | 'notes';
  table: 'highlights' | 'notes' | 'bookmarks';
  keyOf: (userId: string, bookId: number, chapter: number, verse: number) => string;
  store: CollectionStore<T>;
  /** Local record → Supabase upsert payload. Omits `updated_at` (server stamps it). */
  toRemote: (record: T) => Record<string, unknown>;
  /** Supabase row → local record (`dirty: false`). */
  fromRemote: (row: RemoteRow) => T;
};

export type SyncResult = { pushed: number; pulled: number; errored: boolean };
