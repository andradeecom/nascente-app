import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUserHighlights } from '@/hooks/use-highlights';
import { useAuthStore } from '@/stores/auth';
import { useReaderStore } from '@/stores/reader';
import { useTranslate } from '@/i18n';
import { getBookName, getVerses } from '@/services/bible';
import { highlightKey, type Highlight, type HighlightColor } from '@/types/study';

export const studyKeys = {
  highlights: (ids: string[]) => ['study', 'highlights', ids] as const,
};

/** A highlight enriched with its book name + verse text, ready to render. */
export type HighlightItem = {
  key: string;
  bookId: number;
  chapter: number;
  verse: number;
  color: HighlightColor;
  translationId: Highlight['translationId'];
  reference: string;
  text: string;
};

// Enrich raw highlights with book names + verse text from the bundled Bible.
// Verses are fetched once per unique (translation, book, chapter) to keep it cheap.
async function enrichHighlights(highlights: Highlight[]): Promise<HighlightItem[]> {
  const chapters = new Map<string, { translationId: Highlight['translationId']; bookId: number; chapter: number }>();
  for (const h of highlights) {
    chapters.set(`${h.translationId}:${h.bookId}:${h.chapter}`, {
      translationId: h.translationId,
      bookId: h.bookId,
      chapter: h.chapter,
    });
  }

  const versesByChapter = new Map<string, Record<number, string>>();
  const bookNames = new Map<string, string>();
  for (const c of chapters.values()) {
    const verses = await getVerses(c.translationId, c.bookId, c.chapter);
    versesByChapter.set(
      `${c.translationId}:${c.bookId}:${c.chapter}`,
      Object.fromEntries(verses.map((v) => [v.verse, v.text]))
    );
    const bookKey = `${c.translationId}:${c.bookId}`;
    if (!bookNames.has(bookKey)) bookNames.set(bookKey, await getBookName(c.translationId, c.bookId));
  }

  return highlights
    .map((h) => {
      const text = versesByChapter.get(`${h.translationId}:${h.bookId}:${h.chapter}`)?.[h.verse] ?? '';
      const bookName = bookNames.get(`${h.translationId}:${h.bookId}`) ?? '';
      return {
        key: highlightKey(h.userId, h.bookId, h.chapter, h.verse),
        bookId: h.bookId,
        chapter: h.chapter,
        verse: h.verse,
        color: h.color,
        translationId: h.translationId,
        reference: `${bookName} ${h.chapter}:${h.verse}`,
        text,
      };
    })
    .sort((a, b) => a.bookId - b.bookId || a.chapter - b.chapter || a.verse - b.verse);
}

/**
 * Screen-private logic for the Study tab. Loads the signed-in user's highlights
 * (local-first), enriches them with verse text, and wires "open in reader".
 */
export default function useStudyScreen() {
  const translate = useTranslate();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const highlights = useCurrentUserHighlights();
  // Key on the stable highlight identities so the enrichment refetches when the
  // set changes (add/remove) but not on every render.
  const ids = highlights.map((h) => `${h.translationId}:${h.bookId}:${h.chapter}:${h.verse}:${h.color}`).sort();

  const highlightsQuery = useQuery({
    queryKey: studyKeys.highlights(ids),
    queryFn: () => enrichHighlights(highlights),
    enabled: isAuthenticated,
  });

  const handleSignIn = useCallback(() => {
    router.push('/register');
  }, [router]);

  const handleOpenHighlight = useCallback(
    (item: HighlightItem) => {
      const store = useReaderStore.getState();
      if (store.translationId !== item.translationId) store.setTranslation(item.translationId);
      store.setPosition(item.bookId, item.chapter);
      router.push('/(tabs)/reader');
    },
    [router]
  );

  return {
    translate,
    isAuthenticated,
    highlights: highlightsQuery.data ?? [],
    isLoading: highlightsQuery.isLoading,
    isError: highlightsQuery.isError,
    handleSignIn,
    handleOpenHighlight,
  };
}
