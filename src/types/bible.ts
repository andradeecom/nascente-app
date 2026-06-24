export type TranslationId = 'Almeida' | 'RV1909' | 'KJV';

/**
 * Total chapters in the 66-book Protestant canon (all bundled translations).
 * Denominator for the Home "overall Bible progress" stat — translation-independent.
 */
export const TOTAL_BIBLE_CHAPTERS = 1189;

export type TranslationMeta = {
  id: TranslationId;
  label: string;
  lang: 'pt' | 'es' | 'en';
  dbFile: string;
  booksTable: string;
  versesTable: string;
};

export type Book = {
  id: number;
  name: string;
};

export type Verse = {
  id: number;
  bookId: number;
  chapter: number;
  verse: number;
  text: string;
};

export type ChapterInfo = {
  chapter: number;
};

export type SearchResult = {
  bookId: number;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
};

export const TRANSLATIONS: Record<TranslationId, TranslationMeta> = {
  Almeida: {
    id: 'Almeida',
    label: 'Almeida 1911',
    lang: 'pt',
    dbFile: 'Almeida.db',
    booksTable: 'Almeida_books',
    versesTable: 'Almeida_verses',
  },
  RV1909: {
    id: 'RV1909',
    label: 'Reina-Valera 1909',
    lang: 'es',
    dbFile: 'RV1909.db',
    booksTable: 'RV1909_books',
    versesTable: 'RV1909_verses',
  },
  KJV: {
    id: 'KJV',
    label: 'KJV',
    lang: 'en',
    dbFile: 'KJV.db',
    booksTable: 'KJV_books',
    versesTable: 'KJV_verses',
  },
};

export function defaultTranslationForLocale(locale: string): TranslationId {
  if (locale.startsWith('pt')) return 'Almeida';
  if (locale.startsWith('es')) return 'RV1909';
  return 'KJV';
}
