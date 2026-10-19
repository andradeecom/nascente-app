import type { Book } from '@/types/bible';

/**
 * Folds a string for forgiving book-name matching: lowercase, accents stripped
 * (`João` → `joao`, `Génesis` → `genesis`) and whitespace removed so `1co`
 * matches `1 Coríntios`.
 */
export function normalizeBookQuery(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase();
}

/** Books whose folded name contains the folded query, in canonical order. Empty query → all books. */
export function filterBooks(books: Book[], query: string): Book[] {
  const needle = normalizeBookQuery(query);
  if (!needle) return books;
  return books.filter((book) => normalizeBookQuery(book.name).includes(needle));
}
