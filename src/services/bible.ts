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

const DB_ASSETS: Record<TranslationId, number> = {
  Almeida: require('@/assets/db/Almeida.db'),
  RV1909: require('@/assets/db/RV1909.db'),
  KJV: require('@/assets/db/KJV.db'),
};

const dbCache = new Map<TranslationId, SQLite.SQLiteDatabase>();

async function getDb(translationId: TranslationId): Promise<SQLite.SQLiteDatabase> {
  const cached = dbCache.get(translationId);
  if (cached) return cached;

  const meta = TRANSLATIONS[translationId];

  await importDatabaseFromAssetAsync(meta.dbFile, { assetId: DB_ASSETS[translationId] });
  const db = await SQLite.openDatabaseAsync(meta.dbFile);

  dbCache.set(translationId, db);
  return db;
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
