#!/usr/bin/env node

/**
 * build-bible-dbs.mjs
 *
 * Fetches Bible translation data from the getBible API v2 and creates
 * SQLite .db files matching the scrollmapper/bible_databases schema:
 *
 *   translations (translation TEXT PK, title TEXT, license TEXT)
 *   {ABBR}_books   (id INTEGER PK AUTOINCREMENT, name TEXT)
 *   {ABBR}_verses  (id INTEGER PK AUTOINCREMENT, book_id INTEGER, chapter INTEGER, verse INTEGER, text TEXT)
 *
 * Usage:
 *   node scripts/build-bible-dbs.mjs
 *
 * Output:
 *   assets/db/Almeida.db
 *   assets/db/RV1909.db
 */

import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '..', 'assets', 'db');

const API_BASE = 'https://api.getbible.net/v2';

const TRANSLATIONS = [
  {
    apiAbbr: 'almeida',
    outputFile: 'Almeida.db',
    tablePrefix: 'Almeida',
    title: 'Almeida Atualizada (1911)',
    license: 'GPL / Public Domain',
  },
  {
    apiAbbr: 'rv1858',
    outputFile: 'RV1909.db',
    tablePrefix: 'RV1909',
    title: 'Reina-Valera 1909',
    license: 'Public Domain',
  },
];

// Rate-limit: small delay between API requests to be polite
const DELAY_MS = 100;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function buildDb(config) {
  const { apiAbbr, outputFile, tablePrefix, title, license } = config;
  const dbPath = join(OUTPUT_DIR, outputFile);

  console.log(`\n=== Building ${outputFile} (${apiAbbr}) ===`);

  // Remove existing db if present
  if (existsSync(dbPath)) unlinkSync(dbPath);

  // 1. Fetch books list
  console.log('  Fetching books list...');
  const booksData = await fetchJSON(`${API_BASE}/${apiAbbr}/books.json`);
  const bookEntries = Object.values(booksData).sort((a, b) => a.nr - b.nr);
  console.log(`  Found ${bookEntries.length} books`);

  // 2. Create SQLite database
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('encoding = "UTF-8"');

  db.exec(`
    CREATE TABLE translations (
      translation TEXT PRIMARY KEY,
      title TEXT,
      license TEXT
    );

    CREATE TABLE ${tablePrefix}_books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT
    );

    CREATE TABLE ${tablePrefix}_verses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER,
      chapter INTEGER,
      verse INTEGER,
      text TEXT,
      FOREIGN KEY (book_id) REFERENCES ${tablePrefix}_books(id)
    );
  `);

  // 3. Insert translation metadata
  db.prepare('INSERT INTO translations VALUES (?, ?, ?)').run(tablePrefix, title, license);

  // 4. Insert books
  const insertBook = db.prepare(`INSERT INTO ${tablePrefix}_books (id, name) VALUES (?, ?)`);
  const insertVerse = db.prepare(
    `INSERT INTO ${tablePrefix}_verses (book_id, chapter, verse, text) VALUES (?, ?, ?, ?)`
  );

  const insertManyVerses = db.transaction((verses) => {
    for (const v of verses) {
      insertVerse.run(v.book_id, v.chapter, v.verse, v.text);
    }
  });

  let totalVerses = 0;

  for (const book of bookEntries) {
    insertBook.run(book.nr, book.name);

    // Fetch chapters list for this book
    const chaptersData = await fetchJSON(`${API_BASE}/${apiAbbr}/${book.nr}/chapters.json`);
    const chapters = Object.values(chaptersData).sort((a, b) => a.chapter - b.chapter);

    const bookVerses = [];

    for (const chap of chapters) {
      // Fetch chapter verse data
      const chapterData = await fetchJSON(`${API_BASE}/${apiAbbr}/${book.nr}/${chap.chapter}.json`);

      for (const verse of chapterData.verses) {
        bookVerses.push({
          book_id: book.nr,
          chapter: verse.chapter,
          verse: verse.verse,
          text: verse.text,
        });
      }

      await sleep(DELAY_MS);
    }

    insertManyVerses(bookVerses);
    totalVerses += bookVerses.length;
    console.log(`  ${book.name}: ${chapters.length} chapters, ${bookVerses.length} verses`);
  }

  // 5. Create index for fast queries
  db.exec(`CREATE INDEX idx_${tablePrefix}_verses_book_chapter ON ${tablePrefix}_verses (book_id, chapter);`);

  db.close();

  console.log(`  ✅ ${outputFile} created — ${totalVerses} total verses`);
}

async function main() {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const config of TRANSLATIONS) {
    await buildDb(config);
  }

  console.log('\n🎉 All databases built successfully!\n');
  console.log('Files:');
  for (const config of TRANSLATIONS) {
    const p = join(OUTPUT_DIR, config.outputFile);
    console.log(`  ${p}`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
