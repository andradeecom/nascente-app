import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useVerses, useBookName } from '@/hooks/use-bible';
import { useReaderStore } from '@/stores/reader';
import { usePlanReadingStore } from '@/stores/plan-reading';
import { useReadingProgressStore } from '@/stores/reading-progress';
import { useAuthStore } from '@/stores/auth';
import { useMarkPlanDayComplete } from '@/hooks/use-reading-plans';
import { useChapterHighlights, useHighlightActions } from '@/hooks/use-highlights';
import { useChapterBookmarks, useBookmarkActions } from '@/hooks/use-bookmarks';
import { useChapterNotes, useNoteActions } from '@/hooks/use-notes';
import { useSyncOnFocus } from '@/hooks/use-sync';
import { useTranslate } from '@/i18n';
import { getMaxChapter } from '@/services/bible';
import type { TranslationId } from '@/types/bible';
import type { HighlightColor } from '@/types/study';

export default function useReaderScreen() {
  const { translationId, bookId, chapter, setTranslation, setPosition, setChapter } = useReaderStore();
  const router = useRouter();
  const translate = useTranslate();

  // Pull cross-device study changes when the Reader gains focus, so highlights
  // made on another device show up here without waiting for app foreground.
  useSyncOnFocus();

  const session = usePlanReadingStore((s) => s.session);
  const clearSession = usePlanReadingStore((s) => s.clearSession);
  const markComplete = useMarkPlanDayComplete();
  const markChapterRead = useReadingProgressStore((s) => s.markChapterRead);

  // Highlights + bookmarks (signed-in only). Per-chapter lookups feed both the
  // verse rendering and the open action sheet.
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const chapterHighlights = useChapterHighlights(bookId, chapter);
  const { setHighlight, removeHighlight } = useHighlightActions(translationId);
  const chapterBookmarks = useChapterBookmarks(bookId, chapter);
  const { toggleBookmark } = useBookmarkActions(translationId);
  const chapterNotes = useChapterNotes(bookId, chapter);
  const { setNote, removeNote } = useNoteActions(translationId);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  // The verse whose note is being edited (drives the NoteEditorModal). Separate
  // from `selectedVerse` so opening the editor can close the action sheet.
  const [noteVerse, setNoteVerse] = useState<number | null>(null);

  const [bookPickerVisible, setBookPickerVisible] = useState(false);
  const [translationPickerVisible, setTranslationPickerVisible] = useState(false);

  const { data: verses, isLoading } = useVerses(translationId, bookId, chapter);
  const { data: bookName } = useBookName(translationId, bookId);

  // Local-first reading tracking: a chapter counts as read once its verses are on
  // screen; this also stamps "read today" for the streak. Idempotent in the store.
  useEffect(() => {
    if (!isLoading && verses && verses.length > 0) {
      markChapterRead(bookId, chapter);
    }
  }, [isLoading, verses, bookId, chapter, markChapterRead]);

  // Offer "finish today's reading" only when reading the active plan day's last
  // chapter — reachable by scrolling to the end of the passage (the CTA lives in
  // the list footer), so it's an intentional, read-through completion.
  const isPlanDayEnd = session !== null && session.bookId === bookId && session.lastChapter === chapter;

  const handleFinishPlanDay = useCallback(() => {
    if (!session || markComplete.isPending) return;
    markComplete.mutate(
      { userPlanId: session.userPlanId, planId: session.planId, day: session.day, totalDays: session.totalDays },
      {
        onSuccess: ({ finished }) => {
          clearSession();
          Toast.show({
            type: 'success',
            text1: translate(finished ? 'plans.completed.planTitle' : 'plans.completed.dayTitle'),
            text2: translate(finished ? 'plans.completed.planBody' : 'plans.completed.dayBody'),
            visibilityTime: 4000,
          });
          if (router.canGoBack()) router.back();
        },
        onError: () => {
          Toast.show({ type: 'error', text1: translate('plans.loadError') });
        },
      }
    );
  }, [session, markComplete, clearSession, translate, router]);

  // Verse highlighting (gated to signed-in users). Tapping a verse opens the
  // action sheet; picking a color sets it, and there's a remove option.
  const handleVersePress = useCallback(
    (verse: number) => {
      if (!isAuthenticated) return;
      setSelectedVerse(verse);
    },
    [isAuthenticated]
  );

  const handlePickColor = useCallback(
    (color: HighlightColor) => {
      if (selectedVerse == null) return;
      setHighlight(bookId, chapter, selectedVerse, color);
      setSelectedVerse(null);
    },
    [selectedVerse, bookId, chapter, setHighlight]
  );

  const handleRemoveHighlight = useCallback(() => {
    if (selectedVerse == null) return;
    removeHighlight(bookId, chapter, selectedVerse);
    setSelectedVerse(null);
  }, [selectedVerse, bookId, chapter, removeHighlight]);

  // Bookmark toggles in place (sheet stays open so the state change is visible).
  const handleToggleBookmark = useCallback(() => {
    if (selectedVerse == null) return;
    toggleBookmark(bookId, chapter, selectedVerse);
  }, [selectedVerse, bookId, chapter, toggleBookmark]);

  const closeVerseSheet = useCallback(() => setSelectedVerse(null), []);

  // Notes: the sheet's Note action closes the sheet and opens the editor for the
  // same verse; save/delete write through the note store.
  const handleOpenNote = useCallback(() => {
    if (selectedVerse == null) return;
    setNoteVerse(selectedVerse);
    setSelectedVerse(null);
  }, [selectedVerse]);

  const closeNoteEditor = useCallback(() => setNoteVerse(null), []);

  const handleSaveNote = useCallback(
    (body: string) => {
      if (noteVerse == null) return;
      setNote(bookId, chapter, noteVerse, body);
      setNoteVerse(null);
    },
    [noteVerse, bookId, chapter, setNote]
  );

  const handleDeleteNote = useCallback(() => {
    if (noteVerse == null) return;
    removeNote(bookId, chapter, noteVerse);
    setNoteVerse(null);
  }, [noteVerse, bookId, chapter, removeNote]);

  const handleBookChapterSelect = useCallback(
    (newBookId: number, newChapter: number) => {
      // Manually choosing different content ends the plan-reading session.
      clearSession();
      setPosition(newBookId, newChapter);
      setBookPickerVisible(false);
    },
    [setPosition, clearSession]
  );

  const handleTranslationSelect = useCallback(
    (id: TranslationId) => {
      setTranslation(id);
      setTranslationPickerVisible(false);
    },
    [setTranslation]
  );

  // Tapping a Pro-gated translation closes the picker and opens the paywall.
  const handleTranslationUpsell = useCallback(() => {
    setTranslationPickerVisible(false);
    router.push('/paywall');
  }, [router]);

  const handlePrevChapter = useCallback(async () => {
    if (chapter > 1) {
      setChapter(chapter - 1);
    } else if (bookId > 1) {
      const prevMaxCh = await getMaxChapter(translationId, bookId - 1);
      setPosition(bookId - 1, prevMaxCh);
    }
  }, [chapter, bookId, translationId, setChapter, setPosition]);

  const handleNextChapter = useCallback(async () => {
    const maxCh = await getMaxChapter(translationId, bookId);
    if (chapter < maxCh) {
      setChapter(chapter + 1);
    } else if (bookId < 66) {
      setPosition(bookId + 1, 1);
    }
  }, [chapter, bookId, translationId, setChapter, setPosition]);

  return {
    translationId,
    bookId,
    chapter,
    verses,
    isLoading,
    bookName,
    bookPickerVisible,
    translationPickerVisible,
    setBookPickerVisible,
    setTranslationPickerVisible,
    handleBookChapterSelect,
    handleTranslationSelect,
    handleTranslationUpsell,
    handlePrevChapter,
    handleNextChapter,
    isPlanDayEnd,
    isFinishingPlanDay: markComplete.isPending,
    handleFinishPlanDay,
    // Highlights
    chapterHighlights,
    selectedVerse,
    selectedVerseColor: selectedVerse != null ? (chapterHighlights[selectedVerse] ?? null) : null,
    handleVersePress,
    handlePickColor,
    handleRemoveHighlight,
    closeVerseSheet,
    // Bookmarks
    chapterBookmarks,
    selectedVerseBookmarked: selectedVerse != null ? chapterBookmarks.has(selectedVerse) : false,
    handleToggleBookmark,
    // Notes
    selectedVerseHasNote: selectedVerse != null ? chapterNotes[selectedVerse] != null : false,
    handleOpenNote,
    noteEditorVisible: noteVerse != null,
    noteEditorReference: noteVerse != null ? `${bookName ?? ''} ${chapter}:${noteVerse}` : '',
    noteEditorBody: noteVerse != null ? (chapterNotes[noteVerse]?.body ?? '') : '',
    noteEditorHasExisting: noteVerse != null ? chapterNotes[noteVerse] != null : false,
    handleSaveNote,
    handleDeleteNote,
    closeNoteEditor,
  };
}
