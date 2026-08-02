import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUserHighlights, useHighlightActions } from '@/hooks/use-highlights';
import { useCurrentUserBookmarks, useBookmarkActions } from '@/hooks/use-bookmarks';
import { useCurrentUserNotes, useNoteActions } from '@/hooks/use-notes';
import { useSyncOnFocus } from '@/hooks/use-sync';
import { useIsPro, useProGate } from '@/hooks/use-profile';
import { useAuthStore } from '@/stores/auth';
import { useReaderStore } from '@/stores/reader';
import { useTranslate } from '@/i18n';
import { hapticWarning } from '@/lib/haptics';
import { capture } from '@/lib/posthog';
import { getBookName, getVerses } from '@/services/bible';
import { syncAll } from '@/services/sync';
import type { Bookmark, Highlight, HighlightColor, Note } from '@/types/study';
import type { TranslationId } from '@/types/bible';

export type StudyFilter = 'all' | 'highlights' | 'notes' | 'bookmarks';

/** The clearable study types — every filter except the mixed "all" list. */
export type ClearableFilter = Exclude<StudyFilter, 'all'>;

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
  // Study tools are Pro. Data is still per-user (account-bound), so the list
  // query stays enabled on auth; the screen shows the Pro lock card when !isPro.
  const isPro = useIsPro();
  const { openPro, requiresAccount } = useProGate();
  const userId = useAuthStore((s) => s.user?.id) ?? null;

  // Pull cross-device changes whenever the Study tab gains focus (tab switches
  // don't fire the global foreground trigger). Pulled rows flow into the stores
  // the list reads, so the list refreshes on its own.
  useSyncOnFocus();

  // Default to the first real segment (the 'all' filter has no segment in the UI
  // and no empty-state copy) so a segment is selected on first load.
  const [filter, setFilter] = useState<StudyFilter>('highlights');
  // Confirmation dialog for the bulk "clear all (current filter)" action.
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  const highlights = useCurrentUserHighlights();
  const bookmarks = useCurrentUserBookmarks();
  const notes = useCurrentUserNotes();

  // translationId is required by the action-hook signatures but unused by the
  // clear-all actions (they key off userId only); pass the reader's current one.
  const translationId = useReaderStore((s) => s.translationId);
  const { clearAllHighlights } = useHighlightActions(translationId);
  const { clearAllBookmarks } = useBookmarkActions(translationId);
  const { clearAllNotes } = useNoteActions(translationId);

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
      await syncAll(userId);
    }
    await itemsQuery.refetch();
  }, [userId, itemsQuery]);

  // Clear-all is a per-type action: only the three specific tabs offer it (the
  // "All" tab is a mixed list, so a single "clear all" there would be ambiguous).
  // `clearFilter` is the active clearable type when its list is non-empty, else
  // null — it drives the footer button's visibility AND narrows the type off
  // `'all'` so the per-type i18n keys (`clearAll.*.${clearFilter}`) type-check.
  const clearFilter = useMemo<ClearableFilter | null>(() => {
    switch (filter) {
      case 'highlights':
        return highlights.length > 0 ? 'highlights' : null;
      case 'notes':
        return notes.length > 0 ? 'notes' : null;
      case 'bookmarks':
        return bookmarks.length > 0 ? 'bookmarks' : null;
      case 'all':
        return null;
    }
  }, [filter, highlights.length, notes.length, bookmarks.length]);

  const requestClearAll = useCallback(() => setClearConfirmOpen(true), []);
  const cancelClearAll = useCallback(() => setClearConfirmOpen(false), []);

  // Bulk-delete every entry for the active tab's type (soft-delete tombstones, so
  // it syncs), then push. The store writes are reactive, so the list re-derives on
  // its own; we just kick a sync to propagate the tombstones. No-op on "All".
  const confirmClearAll = useCallback(() => {
    hapticWarning();
    if (clearFilter === 'highlights') {
      capture('study_items_cleared', { type: 'highlight', count: highlights.length });
      clearAllHighlights();
    } else if (clearFilter === 'notes') {
      capture('study_items_cleared', { type: 'note', count: notes.length });
      clearAllNotes();
    } else if (clearFilter === 'bookmarks') {
      capture('study_items_cleared', { type: 'bookmark', count: bookmarks.length });
      clearAllBookmarks();
    }
    setClearConfirmOpen(false);
    if (userId != null) void syncAll(userId);
  }, [
    clearFilter,
    clearAllHighlights,
    clearAllNotes,
    clearAllBookmarks,
    userId,
    highlights.length,
    notes.length,
    bookmarks.length,
  ]);

  const handleSignIn = useCallback(() => {
    router.push('/register');
  }, [router]);

  // Wrapped rather than aliased directly: `openPro` now takes a source, and a
  // bare alias would hand it the press event as that argument.
  const handleUpgrade = useCallback(() => openPro('study_tab'), [openPro]);

  // Empty-state CTA — send the user to the reader to create their first item.
  const handleOpenReader = useCallback(() => {
    router.push('/(tabs)/reader');
  }, [router]);

  const handleOpenItem = useCallback(
    (item: StudyItem) => {
      capture('study_item_opened', { type: item.type });
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
    isPro,
    filter,
    setFilter,
    items: filteredItems,
    isLoading: itemsQuery.isLoading,
    isError: itemsQuery.isError,
    isRefetching: itemsQuery.isRefetching,
    refresh,
    clearFilter,
    clearConfirmOpen,
    requestClearAll,
    cancelClearAll,
    confirmClearAll,
    handleSignIn,
    handleUpgrade,
    proRequiresAccount: requiresAccount,
    handleOpenReader,
    handleOpenItem,
  };
}
