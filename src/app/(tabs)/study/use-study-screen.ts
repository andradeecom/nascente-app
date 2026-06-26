import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUserHighlights } from '@/hooks/use-highlights';
import { useCurrentUserBookmarks } from '@/hooks/use-bookmarks';
import { useCurrentUserNotes } from '@/hooks/use-notes';
import { useSyncOnFocus } from '@/hooks/use-study-sync';
import { useAuthStore } from '@/stores/auth';
import { useReaderStore } from '@/stores/reader';
import { useTranslate } from '@/i18n';
import { getBookName, getVerses } from '@/services/bible';
import { syncAllStudyTools } from '@/services/sync';
import type { Bookmark, Highlight, HighlightColor, Note } from '@/types/study';
import type { TranslationId } from '@/types/bible';

export type StudyFilter = 'all' | 'highlights' | 'notes' | 'bookmarks';

export const studyKeys = {
  items: (ids: string[]) => ['study', 'items', ids] as const,
};

/** A study annotation (highlight / bookmark / note) enriched for the list. */
export type StudyItem = {
  key: string;
  type: 'highlight' | 'bookmark' | 'note';
  bookId: number;
  chapter: number;
  verse: number;
  translationId: TranslationId;
  reference: string;
  text: string;
  /** Highlights only. */
  color?: HighlightColor;
  /** Notes only — the user's note body. */
  body?: string;
};

// A minimal per-verse shape the enrichment can resolve (book name + verse text).
type VerseRef = {
  type: StudyItem['type'];
  bookId: number;
  chapter: number;
  verse: number;
  translationId: TranslationId;
  color?: HighlightColor;
  body?: string;
};

// Enrich raw per-verse items with book names + verse text from the bundled Bible.
// Verses/book name are fetched once per unique (translation, book, chapter) to keep it cheap.
async function enrichItems(refs: VerseRef[]): Promise<StudyItem[]> {
  const chapters = new Map<string, { translationId: TranslationId; bookId: number; chapter: number }>();
  for (const r of refs) {
    chapters.set(`${r.translationId}:${r.bookId}:${r.chapter}`, {
      translationId: r.translationId,
      bookId: r.bookId,
      chapter: r.chapter,
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

  return refs
    .map((r) => {
      const text = versesByChapter.get(`${r.translationId}:${r.bookId}:${r.chapter}`)?.[r.verse] ?? '';
      const bookName = bookNames.get(`${r.translationId}:${r.bookId}`) ?? '';
      return {
        key: `${r.type}:${r.translationId}:${r.bookId}:${r.chapter}:${r.verse}`,
        type: r.type,
        bookId: r.bookId,
        chapter: r.chapter,
        verse: r.verse,
        translationId: r.translationId,
        reference: `${bookName} ${r.chapter}:${r.verse}`,
        text,
        color: r.color,
        body: r.body,
      };
    })
    .sort((a, b) => a.bookId - b.bookId || a.chapter - b.chapter || a.verse - b.verse);
}

function highlightToRef(h: Highlight): VerseRef {
  return {
    type: 'highlight',
    bookId: h.bookId,
    chapter: h.chapter,
    verse: h.verse,
    translationId: h.translationId,
    color: h.color,
  };
}
function bookmarkToRef(b: Bookmark): VerseRef {
  return { type: 'bookmark', bookId: b.bookId, chapter: b.chapter, verse: b.verse, translationId: b.translationId };
}
function noteToRef(n: Note): VerseRef {
  return {
    type: 'note',
    bookId: n.bookId,
    chapter: n.chapter,
    verse: n.verse,
    translationId: n.translationId,
    body: n.body,
  };
}

/**
 * Screen-private logic for the Study tab. Loads the signed-in user's
 * annotations (highlights + bookmarks, local-first), enriches them with verse
 * text, exposes a filter, and wires "open in reader".
 */
export default function useStudyScreen() {
  const translate = useTranslate();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user?.id) ?? null;

  // Pull cross-device changes whenever the Study tab gains focus (tab switches
  // don't fire the global foreground trigger). Pulled rows flow into the stores
  // the list reads, so the list refreshes on its own.
  useSyncOnFocus();

  const [filter, setFilter] = useState<StudyFilter>('all');

  const highlights = useCurrentUserHighlights();
  const bookmarks = useCurrentUserBookmarks();
  const notes = useCurrentUserNotes();

  const refs = useMemo(
    () => [...highlights.map(highlightToRef), ...bookmarks.map(bookmarkToRef), ...notes.map(noteToRef)],
    [highlights, bookmarks, notes]
  );

  // Key on the stable item identities (including note body) so enrichment
  // refetches when the set changes (add/remove/edit) but not on every render.
  const ids = useMemo(
    () =>
      refs
        .map((r) => `${r.type}:${r.translationId}:${r.bookId}:${r.chapter}:${r.verse}:${r.color ?? ''}:${r.body ?? ''}`)
        .sort(),
    [refs]
  );

  const itemsQuery = useQuery({
    queryKey: studyKeys.items(ids),
    queryFn: () => enrichItems(refs),
    enabled: isAuthenticated,
  });

  const filteredItems = useMemo(() => {
    const all = itemsQuery.data ?? [];
    if (filter === 'all') return all;
    const type = filter === 'highlights' ? 'highlight' : filter === 'bookmarks' ? 'bookmark' : 'note';
    return all.filter((i) => i.type === type);
  }, [itemsQuery.data, filter]);

  const refresh = useCallback(async () => {
    if (userId != null) {
      await syncAllStudyTools(userId);
    }
    await itemsQuery.refetch();
  }, [userId, itemsQuery]);

  const handleSignIn = useCallback(() => {
    router.push('/register');
  }, [router]);

  const handleOpenItem = useCallback(
    (item: StudyItem) => {
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
    filter,
    setFilter,
    items: filteredItems,
    isLoading: itemsQuery.isLoading,
    isError: itemsQuery.isError,
    isRefetching: itemsQuery.isRefetching,
    refresh,
    handleSignIn,
    handleOpenItem,
  };
}
