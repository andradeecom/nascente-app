import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type View as RNView } from 'react-native';
import { useIsFocused, useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTourPersistence } from '@wrack/react-native-tour-guide';
import { useVerses, useBookName } from '@/hooks/use-bible';
import { hapticSelect, hapticConfirm, hapticSuccess, hapticWarning } from '@/lib/haptics';
import { useReaderStore } from '@/stores/reader';
import { usePlanReadingStore } from '@/stores/plan-reading';
import { computeStreak, useReadingProgressStore } from '@/stores/reading-progress';
import { useIsPro } from '@/hooks/use-profile';
import { useMarkPlanDayComplete } from '@/hooks/use-reading-plans';
import { useChapterHighlights, useHighlightActions } from '@/hooks/use-highlights';
import { useChapterBookmarks, useBookmarkActions } from '@/hooks/use-bookmarks';
import { useChapterNotes, useNoteActions } from '@/hooks/use-notes';
import { useSyncOnFocus } from '@/hooks/use-sync';
import { useTranslate } from '@/i18n';
import { getMaxChapter } from '@/services/bible';
import { useLocaleStore } from '@/stores/locale';
import { useAiGenerate } from '@/hooks/use-ai-generate';
import { maybeRequestReview } from '@/lib/review-prompt';
import type { TranslationId } from '@/types/bible';
import type { HighlightColor } from '@/types/study';
import type { AiGenerateError } from '@/types/ai';

export default function useReaderScreen() {
  const { translationId, bookId, chapter, setTranslation, setPosition, setChapter } = useReaderStore();
  const router = useRouter();
  const translate = useTranslate();
  // NativeTabs keeps every tab screen mounted in the background for instant
  // switching — without this, a mount-gated effect (like the chapter-summary
  // tour below) fires as soon as its data loads, even while a DIFFERENT tab is
  // visible, and the tour overlay (a root-level Modal) shows up wherever the
  // user actually is.
  const isFocused = useIsFocused();

  // Pull cross-device study changes when the Reader gains focus, so highlights
  // made on another device show up here without waiting for app foreground.
  useSyncOnFocus();

  const session = usePlanReadingStore((s) => s.session);
  const clearSession = usePlanReadingStore((s) => s.clearSession);
  const markComplete = useMarkPlanDayComplete();
  const markChapterRead = useReadingProgressStore((s) => s.markChapterRead);
  const readDays = useReadingProgressStore((s) => s.readDays);

  // Highlights + bookmarks (Pro only). Per-chapter lookups feed both the
  // verse rendering and the open action sheet.
  const isPro = useIsPro();
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

  // First-time AI-features tour: spotlights the Explain/Prayer buttons inside
  // VerseActionSheet the first time a Pro user opens it. `useTourPersistence`
  // handles the "show only once" gating itself (AsyncStorage-backed), so no
  // separate store is needed here (unlike `review-prompt.ts`'s pattern, which
  // predates this library). Refs point at the ref-carrying Views wrapping the
  // buttons in VerseActionSheet — Button itself doesn't forward refs.
  const explainTargetRef = useRef<RNView>(null);
  const prayerTargetRef = useRef<RNView>(null);
  const summaryTargetRef = useRef<RNView>(null);
  const { startTour: startAiTour } = useTourPersistence(AsyncStorage);

  // AI state
  const locale = useLocaleStore((s) => s.locale) ?? 'pt';
  const [explainVerse, setExplainVerse] = useState<number | null>(null);
  const [explainMode, setExplainMode] = useState<'explain' | 'explain_simple'>('explain');
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [prayerVerse, setPrayerVerse] = useState<number | null>(null);

  // Plan-day completion celebration (replaces the old success toast). `finished`
  // distinguishes "day done" from "whole plan done" for the copy. Null = hidden.
  const [planComplete, setPlanComplete] = useState<{ finished: boolean } | null>(null);

  const [bookPickerVisible, setBookPickerVisible] = useState(false);
  const [translationPickerVisible, setTranslationPickerVisible] = useState(false);

  const { data: verses, isLoading } = useVerses(translationId, bookId, chapter);
  const { data: bookName } = useBookName(translationId, bookId);

  // Separate tour instance (own tourId) from the verse-sheet Explain/Prayer
  // tour above — this spotlights the chapter-summary button in ChapterNavBar,
  // fires once the chapter has actually loaded for a Pro user, and isn't tied
  // to any tap gesture (the button is always visible, not opened on demand).
  // Gated on `isFocused` — the Reader stays mounted in the background when
  // another tab is active (NativeTabs), so without this the tour could fire
  // (and its overlay render) while the user is looking at a different screen.
  useEffect(() => {
    if (!isFocused || !isPro || isLoading || !verses?.length) return;
    startAiTour(
      [
        {
          id: 'ai-chapter-summary',
          targetRef: summaryTargetRef,
          title: translate('aiTour.chapterSummary.title'),
          description: translate('aiTour.chapterSummary.description'),
        },
      ],
      { tourId: 'ai-features-chapter-summary' }
    );
  }, [isFocused, isPro, isLoading, verses, startAiTour, translate]);

  const explainPassageText = useMemo(() => {
    if (explainVerse == null || !verses) return '';
    return verses.find((v) => v.verse === explainVerse)?.text ?? '';
  }, [explainVerse, verses]);

  const chapterPassageText = useMemo(() => {
    if (!verses) return '';
    return verses.map((v) => `${v.verse}. ${v.text}`).join(' ');
  }, [verses]);

  const prayerPassageText = useMemo(() => {
    if (prayerVerse == null || !verses) return '';
    return verses.find((v) => v.verse === prayerVerse)?.text ?? '';
  }, [prayerVerse, verses]);

  const explainQuery = useAiGenerate({
    translationId,
    bookId,
    chapter,
    verseStart: explainVerse ?? 0,
    verseEnd: explainVerse ?? 0,
    promptType: explainMode,
    passageText: explainPassageText,
    locale: locale as 'en' | 'es' | 'pt',
    reference: bookName && explainVerse != null ? `${bookName} ${chapter}:${explainVerse}` : undefined,
    enabled: explainVerse != null && isPro,
  });

  const summaryQuery = useAiGenerate({
    translationId,
    bookId,
    chapter,
    verseStart: 0,
    verseEnd: 0,
    promptType: 'chapter_summary',
    passageText: chapterPassageText,
    locale: locale as 'en' | 'es' | 'pt',
    reference: bookName ? `${bookName} ${chapter}` : undefined,
    enabled: summaryVisible && isPro,
  });

  const prayerQuery = useAiGenerate({
    translationId,
    bookId,
    chapter,
    verseStart: prayerVerse ?? 0,
    verseEnd: prayerVerse ?? 0,
    promptType: 'prayer_prompt',
    passageText: prayerPassageText,
    locale: locale as 'en' | 'es' | 'pt',
    reference: bookName && prayerVerse != null ? `${bookName} ${chapter}:${prayerVerse}` : undefined,
    enabled: prayerVerse != null && isPro,
  });

  // Local-first reading tracking: a chapter counts as read once its verses are on
  // screen; this also stamps "read today" for the streak. Idempotent in the store.
  useEffect(() => {
    if (!isLoading && verses && verses.length > 0) {
      markChapterRead(bookId, chapter);
    }
  }, [isLoading, verses, bookId, chapter, markChapterRead]);

  // Second review-prompt trigger, for free/guest readers only — Pro users are
  // already covered by the whole-plan-completion trigger above, and gating this
  // to non-Pro avoids the two triggers racing for the same once-per-install ask.
  // A 3-day reading streak is an early but real satisfaction signal for readers
  // who may never touch Pro-gated Plans. Reacts to `readDays` itself (not the
  // per-chapter effect above) so it only fires the day the streak advances, not
  // on every chapter view.
  useEffect(() => {
    if (!isPro && computeStreak(readDays) === 3) void maybeRequestReview();
  }, [isPro, readDays]);

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
          // Show the celebration modal; session clear + navigate-back happen when
          // the user taps Continue (see handlePlanCompleteContinue), so navigating
          // away doesn't unmount the modal before it's seen.
          hapticSuccess();
          setPlanComplete({ finished });
        },
        onError: () => {
          Toast.show({ type: 'error', text1: translate('plans.loadError') });
        },
      }
    );
  }, [session, markComplete, translate]);

  const handlePlanCompleteContinue = useCallback(() => {
    // Finishing a whole plan is a high-satisfaction "goal achieved" moment —
    // ask after the celebration lands, not on top of it.
    if (planComplete?.finished) void maybeRequestReview();
    setPlanComplete(null);
    clearSession();
    if (router.canGoBack()) router.back();
  }, [planComplete, clearSession, router]);

  // Verse study actions are Pro. The verse is only rendered as a pressable for Pro
  // users (see the Reader's renderVerse — non-Pro verses are plain, non-interactive
  // text), so this opens the action sheet. The `!isPro` guard is defense-in-depth.
  const handleVersePress = useCallback(
    (verse: number) => {
      if (!isPro) return;
      hapticSelect();
      setSelectedVerse(verse);

      // Fire the first-time AI tour once the sheet has had time to open and lay
      // out (gorhom's BottomSheet animates in — `delayBefore` waits for that
      // before the library measures the target; it also retries measurement
      // internally if the target isn't ready yet). `useTourPersistence` no-ops
      // if this tour has already been shown on this device.
      startAiTour(
        [
          {
            id: 'ai-explain',
            targetRef: explainTargetRef,
            title: translate('aiTour.explain.title'),
            description: translate('aiTour.explain.description'),
            delayBefore: 400,
          },
          {
            id: 'ai-prayer',
            targetRef: prayerTargetRef,
            title: translate('aiTour.prayer.title'),
            description: translate('aiTour.prayer.description'),
          },
        ],
        { tourId: 'ai-features-reader' }
      );
    },
    [isPro, startAiTour, translate]
  );

  const handlePickColor = useCallback(
    (color: HighlightColor) => {
      if (selectedVerse == null) return;
      hapticConfirm();
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
    hapticConfirm();
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
      hapticConfirm();
      setNote(bookId, chapter, noteVerse, body);
      setNoteVerse(null);
    },
    [noteVerse, bookId, chapter, setNote]
  );

  const handleDeleteNote = useCallback(() => {
    if (noteVerse == null) return;
    hapticWarning();
    removeNote(bookId, chapter, noteVerse);
    setNoteVerse(null);
  }, [noteVerse, bookId, chapter, removeNote]);

  const handleOpenExplain = useCallback(() => {
    if (selectedVerse == null) return;
    setExplainVerse(selectedVerse);
    setExplainMode('explain');
    setSelectedVerse(null);
  }, [selectedVerse]);

  const handleToggleExplainMode = useCallback((mode: 'explain' | 'explain_simple') => {
    setExplainMode(mode);
  }, []);

  const closeExplainSheet = useCallback(() => setExplainVerse(null), []);

  const handleOpenPray = useCallback(() => {
    if (selectedVerse == null) return;
    setPrayerVerse(selectedVerse);
    setSelectedVerse(null);
  }, [selectedVerse]);

  const closePrayerSheet = useCallback(() => setPrayerVerse(null), []);

  const handleOpenSummary = useCallback(() => {
    if (!isPro) {
      router.push('/paywall');
      return;
    }
    setSummaryVisible(true);
  }, [isPro, router]);

  const closeSummarySheet = useCallback(() => setSummaryVisible(false), []);

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
    isPro,
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
    planComplete,
    handlePlanCompleteContinue,
    // Highlights
    chapterHighlights,
    selectedVerse,
    selectedVerseColor: selectedVerse != null ? (chapterHighlights[selectedVerse] ?? null) : null,
    handleVersePress,
    handlePickColor,
    handleRemoveHighlight,
    closeVerseSheet,
    explainTargetRef,
    prayerTargetRef,
    summaryTargetRef,
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
    // AI — Explain
    explainVerse,
    explainMode,
    explainContent: explainQuery.data?.content ?? null,
    explainLoading: explainQuery.isFetching,
    explainError: explainQuery.error as AiGenerateError | null,
    handleOpenExplain,
    handleToggleExplainMode,
    closeExplainSheet,
    retryExplain: explainQuery.refetch,
    // AI — Chapter Summary
    summaryVisible,
    summaryContent: summaryQuery.data?.content ?? null,
    summaryLoading: summaryQuery.isFetching,
    summaryError: summaryQuery.error as AiGenerateError | null,
    handleOpenSummary,
    closeSummarySheet,
    retrySummary: summaryQuery.refetch,
    // AI — Prayer prompt
    prayerVerse,
    prayerContent: prayerQuery.data?.content ?? null,
    prayerLoading: prayerQuery.isFetching,
    prayerError: prayerQuery.error as AiGenerateError | null,
    handleOpenPray,
    closePrayerSheet,
    retryPrayer: prayerQuery.refetch,
  };
}
