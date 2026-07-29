import * as SQLite from 'expo-sqlite';
import { importDatabaseFromAssetAsync } from 'expo-sqlite';
import {
  TRANSLATIONS,
  type TranslationId,
  type Book,
  type Verse,
  type ChapterInfo,
  type SearchResult,
} from '@/types/bible';

// Every translation (free + Pro) is bundled — Pro is an entitlement gate, not a
// download (see `.docs/bible-translation-licensing.md`). The Pro `.db` files are
// produced by `scripts/build-bible-dbs.mjs`; uncomment each entry here once the
// matching file exists in `assets/db/` (a `require` on a missing asset fails the
// Metro bundler). A Pro translation with no asset yet throws a clear error if opened.
const DB_ASSETS: Partial<Record<TranslationId, number>> = {
  // Free (bundled, public-domain)
  BibliaLivre: require('@/assets/db/BibliaLivre.db'),
  RV1909: require('@/assets/db/RV1909.db'),
  WEB: require('@/assets/db/WEB.db'),
  // Pro (bundled, public-domain) — uncomment once each .db file is generated:
  Almeida: require('@/assets/db/Almeida.db'),
  ONBV: require('@/assets/db/ONBV.db'),
  ONBVes: require('@/assets/db/ONBVes.db'),
  SSE: require('@/assets/db/SSE.db'),
  KJV: require('@/assets/db/KJV.db'),
  ASV: require('@/assets/db/ASV.db'),
  // YLT: require('@/assets/db/YLT.db'),
};

// Cache the open *promise*, not the resolved DB. Several reader queries fire at
// once on mount; caching the resolved value only after both awaits complete lets
// each concurrent call re-run the import+open on the same file. On Android those
// overlapping opens collide and one yields a DB with a null native handle — the
// first prepareAsync on it throws `NullPointerException` (seen on fresh builds,
// where the asset import actually runs). Caching the promise means all callers
// await the single open.
const dbCache = new Map<TranslationId, Promise<SQLite.SQLiteDatabase>>();

function getDb(translationId: TranslationId): Promise<SQLite.SQLiteDatabase> {
  const cached = dbCache.get(translationId);
  if (cached) return cached;

  const meta = TRANSLATIONS[translationId];
  const assetId = DB_ASSETS[translationId];
  if (assetId == null) {
    throw new Error(
      `Translation "${translationId}" is not bundled yet. Generate ${meta.dbFile} with ` +
        `scripts/build-bible-dbs.mjs and enable its entry in DB_ASSETS.`
    );
  }

  const open = (async () => {
    await importDatabaseFromAssetAsync(meta.dbFile, { assetId, forceOverwrite: false });
    return SQLite.openDatabaseAsync(meta.dbFile);
  })();

  // Drop a rejected open from the cache so a later call can retry rather than
  // being permanently poisoned by one transient failure.
  open.catch(() => dbCache.delete(translationId));

  dbCache.set(translationId, open);
  return open;
}

export async function getBooks(translationId: TranslationId): Promise<Book[]> {
  const db = await getDb(translationId);
  const { booksTable } = TRANSLATIONS[translationId];

  const rows = await db.getAllAsync<{ id: number; name: string }>(`SELECT id, name FROM ${booksTable} ORDER BY id`);

  return rows.map((r) => ({ id: r.id, name: r.name }));
}

export async function getChapters(translationId: TranslationId, bookId: number): Promise<ChapterInfo[]> {
  const db = await getDb(translationId);
  const { versesTable } = TRANSLATIONS[translationId];

  const rows = await db.getAllAsync<{ chapter: number }>(
    `SELECT DISTINCT chapter FROM ${versesTable} WHERE book_id = ? ORDER BY chapter`,
    [bookId]
  );

  return rows.map((r) => ({ chapter: r.chapter }));
}

export async function getVerses(translationId: TranslationId, bookId: number, chapter: number): Promise<Verse[]> {
  const db = await getDb(translationId);
  const { versesTable } = TRANSLATIONS[translationId];

  const rows = await db.getAllAsync<{ id: number; book_id: number; chapter: number; verse: number; text: string }>(
    `SELECT id, book_id, chapter, verse, text FROM ${versesTable} WHERE book_id = ? AND chapter = ? ORDER BY verse`,
    [bookId, chapter]
  );

  return rows.map((r) => ({
    id: r.id,
    bookId: r.book_id,
    chapter: r.chapter,
    verse: r.verse,
    text: r.text,
  }));
}

export async function getVerse(
  translationId: TranslationId,
  bookId: number,
  chapter: number,
  verse: number
): Promise<Verse | null> {
  const db = await getDb(translationId);
  const { versesTable } = TRANSLATIONS[translationId];

  const row = await db.getFirstAsync<{ id: number; book_id: number; chapter: number; verse: number; text: string }>(
    `SELECT id, book_id, chapter, verse, text FROM ${versesTable} WHERE book_id = ? AND chapter = ? AND verse = ?`,
    [bookId, chapter, verse]
  );

  if (!row) return null;
  return { id: row.id, bookId: row.book_id, chapter: row.chapter, verse: row.verse, text: row.text };
}

export async function searchVerses(translationId: TranslationId, query: string): Promise<SearchResult[]> {
  const db = await getDb(translationId);
  const { booksTable, versesTable } = TRANSLATIONS[translationId];

  const rows = await db.getAllAsync<{
    book_id: number;
    book_name: string;
    chapter: number;
    verse: number;
    text: string;
  }>(
    `SELECT v.book_id, b.name AS book_name, v.chapter, v.verse, v.text
     FROM ${versesTable} v
     JOIN ${booksTable} b ON b.id = v.book_id
     WHERE v.text LIKE ?
     ORDER BY v.book_id, v.chapter, v.verse
     LIMIT 100`,
    [`%${query}%`]
  );

  return rows.map((r) => ({
    bookId: r.book_id,
    bookName: r.book_name,
    chapter: r.chapter,
    verse: r.verse,
    text: r.text,
  }));
}

export async function getBookName(translationId: TranslationId, bookId: number): Promise<string> {
  const db = await getDb(translationId);
  const { booksTable } = TRANSLATIONS[translationId];

  const row = await db.getFirstAsync<{ name: string }>(`SELECT name FROM ${booksTable} WHERE id = ?`, [bookId]);

  return row?.name ?? '';
}

export async function getMaxChapter(translationId: TranslationId, bookId: number): Promise<number> {
  const db = await getDb(translationId);
  const { versesTable } = TRANSLATIONS[translationId];

  const row = await db.getFirstAsync<{ max_ch: number }>(
    `SELECT MAX(chapter) AS max_ch FROM ${versesTable} WHERE book_id = ?`,
    [bookId]
  );

  return row?.max_ch ?? 1;
}
