import { useQuery } from '@tanstack/react-query';
import { getBooks, getChapters, getVerses, searchVerses, getBookName } from '@/services/bible';
import type { TranslationId } from '@/types/bible';

export const bibleKeys = {
  books: (t: TranslationId) => ['bible', 'books', t] as const,
  chapters: (t: TranslationId, bookId: number) => ['bible', 'chapters', t, bookId] as const,
  verses: (t: TranslationId, bookId: number, chapter: number) => ['bible', 'verses', t, bookId, chapter] as const,
  search: (t: TranslationId, q: string) => ['bible', 'search', t, q] as const,
  bookName: (t: TranslationId, bookId: number) => ['bible', 'bookName', t, bookId] as const,
};

export function useBooks(translationId: TranslationId) {
  return useQuery({
    queryKey: bibleKeys.books(translationId),
    queryFn: () => getBooks(translationId),
    staleTime: Infinity,
  });
}

export function useChapters(translationId: TranslationId, bookId: number) {
  return useQuery({
    queryKey: bibleKeys.chapters(translationId, bookId),
    queryFn: () => getChapters(translationId, bookId),
    staleTime: Infinity,
  });
}

export function useVerses(translationId: TranslationId, bookId: number, chapter: number) {
  return useQuery({
    queryKey: bibleKeys.verses(translationId, bookId, chapter),
    queryFn: () => getVerses(translationId, bookId, chapter),
    staleTime: Infinity,
  });
}

export function useSearchVerses(translationId: TranslationId, query: string) {
  return useQuery({
    queryKey: bibleKeys.search(translationId, query),
    queryFn: () => searchVerses(translationId, query),
    enabled: query.length >= 3,
    staleTime: 60_000,
  });
}

export function useBookName(translationId: TranslationId, bookId: number) {
  return useQuery({
    queryKey: bibleKeys.bookName(translationId, bookId),
    queryFn: () => getBookName(translationId, bookId),
    staleTime: Infinity,
  });
}
