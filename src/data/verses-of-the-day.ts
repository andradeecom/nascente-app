/**
 * Curated "verse of the day" pool — **references only** (book id / chapter /
 * verse), no verse text. The text and the localized reference label are resolved
 * at runtime from the bundled SQLite DB in the reader's current translation (see
 * `use-home-screen.ts`), so nothing here is hardcoded per-language and the verse
 * always matches the translation the user reads in.
 *
 * These are well-known, encouraging passages (curated so a random pick never
 * lands on a genealogy or a mid-sentence fragment). Book ids follow the standard
 * 66-book Protestant order (Genesis = 1 … Revelation = 66), matching the bundled
 * DBs' `book_id` column.
 */
export type VerseRef = {
  bookId: number;
  chapter: number;
  verse: number;
};

export const VERSES_OF_THE_DAY: VerseRef[] = [
  { bookId: 43, chapter: 3, verse: 16 }, // John 3:16
  { bookId: 43, chapter: 1, verse: 1 }, // John 1:1
  { bookId: 43, chapter: 14, verse: 6 }, // John 14:6
  { bookId: 19, chapter: 23, verse: 1 }, // Psalm 23:1
  { bookId: 19, chapter: 46, verse: 1 }, // Psalm 46:1
  { bookId: 19, chapter: 27, verse: 1 }, // Psalm 27:1
  { bookId: 19, chapter: 37, verse: 4 }, // Psalm 37:4
  { bookId: 19, chapter: 118, verse: 24 }, // Psalm 118:24
  { bookId: 19, chapter: 119, verse: 105 }, // Psalm 119:105
  { bookId: 19, chapter: 121, verse: 1 }, // Psalm 121:1
  { bookId: 19, chapter: 91, verse: 1 }, // Psalm 91:1
  { bookId: 19, chapter: 34, verse: 8 }, // Psalm 34:8
  { bookId: 20, chapter: 3, verse: 5 }, // Proverbs 3:5
  { bookId: 20, chapter: 3, verse: 6 }, // Proverbs 3:6
  { bookId: 20, chapter: 16, verse: 3 }, // Proverbs 16:3
  { bookId: 23, chapter: 40, verse: 31 }, // Isaiah 40:31
  { bookId: 23, chapter: 41, verse: 10 }, // Isaiah 41:10
  { bookId: 23, chapter: 26, verse: 3 }, // Isaiah 26:3
  { bookId: 23, chapter: 43, verse: 2 }, // Isaiah 43:2
  { bookId: 24, chapter: 29, verse: 11 }, // Jeremiah 29:11
  { bookId: 25, chapter: 3, verse: 22 }, // Lamentations 3:22
  { bookId: 25, chapter: 3, verse: 23 }, // Lamentations 3:23
  { bookId: 6, chapter: 1, verse: 9 }, // Joshua 1:9
  { bookId: 5, chapter: 31, verse: 6 }, // Deuteronomy 31:6
  { bookId: 4, chapter: 6, verse: 24 }, // Numbers 6:24
  { bookId: 2, chapter: 14, verse: 14 }, // Exodus 14:14
  { bookId: 40, chapter: 6, verse: 33 }, // Matthew 6:33
  { bookId: 40, chapter: 11, verse: 28 }, // Matthew 11:28
  { bookId: 40, chapter: 28, verse: 19 }, // Matthew 28:19
  { bookId: 40, chapter: 5, verse: 16 }, // Matthew 5:16
  { bookId: 41, chapter: 10, verse: 27 }, // Mark 10:27
  { bookId: 45, chapter: 8, verse: 28 }, // Romans 8:28
  { bookId: 45, chapter: 8, verse: 38 }, // Romans 8:38
  { bookId: 45, chapter: 12, verse: 2 }, // Romans 12:2
  { bookId: 45, chapter: 15, verse: 13 }, // Romans 15:13
  { bookId: 45, chapter: 5, verse: 8 }, // Romans 5:8
  { bookId: 46, chapter: 13, verse: 4 }, // 1 Corinthians 13:4
  { bookId: 46, chapter: 10, verse: 13 }, // 1 Corinthians 10:13
  { bookId: 47, chapter: 5, verse: 17 }, // 2 Corinthians 5:17
  { bookId: 48, chapter: 5, verse: 22 }, // Galatians 5:22
  { bookId: 49, chapter: 2, verse: 8 }, // Ephesians 2:8
  { bookId: 50, chapter: 4, verse: 13 }, // Philippians 4:13
  { bookId: 50, chapter: 4, verse: 6 }, // Philippians 4:6
  { bookId: 50, chapter: 4, verse: 7 }, // Philippians 4:7
  { bookId: 51, chapter: 3, verse: 23 }, // Colossians 3:23
  { bookId: 58, chapter: 11, verse: 1 }, // Hebrews 11:1
  { bookId: 58, chapter: 13, verse: 8 }, // Hebrews 13:8
  { bookId: 59, chapter: 1, verse: 5 }, // James 1:5
  { bookId: 60, chapter: 5, verse: 7 }, // 1 Peter 5:7
  { bookId: 62, chapter: 4, verse: 19 }, // 1 John 4:19
  { bookId: 62, chapter: 1, verse: 9 }, // 1 John 1:9
  { bookId: 66, chapter: 21, verse: 4 }, // Revelation 21:4
  { bookId: 1, chapter: 1, verse: 1 }, // Genesis 1:1
  { bookId: 21, chapter: 3, verse: 1 }, // Ecclesiastes 3:1
  { bookId: 33, chapter: 6, verse: 8 }, // Micah 6:8
  { bookId: 36, chapter: 3, verse: 17 }, // Zephaniah 3:17
];
