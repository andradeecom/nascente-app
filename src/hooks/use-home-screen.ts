import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslate } from '@/i18n';
import { useAuthStore } from '@/stores/auth';
import { useReaderStore } from '@/stores/reader';
import { useLocaleStore } from '@/stores/locale';
import { computeStreak, useReadingProgressStore } from '@/stores/reading-progress';
import { useSyncOnFocus } from '@/hooks/use-sync';
import { useCurrentUserHighlights } from '@/hooks/use-highlights';
import { useIsPro } from '@/hooks/use-profile';
import { useBookName, useVerse } from '@/hooks/use-bible';
import { useActivePlans } from '@/hooks/use-reading-plans';
import { useAiGenerate } from '@/hooks/use-ai-generate';
import { TOTAL_BIBLE_CHAPTERS, TRANSLATIONS } from '@/types/bible';
import { VERSES_OF_THE_DAY } from '@/data/verses-of-the-day';
import type { AiGenerateError } from '@/types/ai';
import type { TimeOfDay } from '@/components/organisms';

// ── Verse of the day ────────────────────────────────────────────────────────
// Curated references live in `@/data/verses-of-the-day` (coordinates only); the
// verse text + localized reference label are resolved from the bundled DB in the
// reader's translation (below), so nothing is hardcoded per-language.

function pickRandomVerseRef() {
  return VERSES_OF_THE_DAY[Math.floor(Math.random() * VERSES_OF_THE_DAY.length)];
}

// ── Time-of-day greeting ────────────────────────────────────────────────────

// Single time bucket drives the welcome card scene + its greeting/subtitle copy.
function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'noon';
  return 'night';
}

const GREETING_KEY = {
  morning: 'home.greetingMorning',
  noon: 'home.greetingAfternoon',
  night: 'home.greetingEvening',
} as const satisfies Record<TimeOfDay, string>;

const SUBTITLE_KEY = {
  morning: 'home.subtitleMorning',
  noon: 'home.subtitleAfternoon',
  night: 'home.subtitleEvening',
} as const satisfies Record<TimeOfDay, string>;

// ── Hook ────────────────────────────────────────────────────────────────────

export function useHomeScreen() {
  const translate = useTranslate();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const locale = useLocaleStore((s) => s.locale) ?? 'pt';

  // Pull cross-device progress/highlight changes when Home gains focus, so the
  // stats reflect reading done on another device without waiting for foreground.
  useSyncOnFocus();

  // Reader store — "continue reading" card
  const translationId = useReaderStore((s) => s.translationId);
  const bookId = useReaderStore((s) => s.bookId);
  const chapter = useReaderStore((s) => s.chapter);
  const { data: bookName } = useBookName(translationId, bookId);
  const translationLabel = TRANSLATIONS[translationId].label;

  // Active plans
  const activePlans = useActivePlans();

  // Pro gating. Under the "free reading, Pro everything-else" model, the Pro
  // nudge shows to ALL non-Pro users (guests included) — there's no competing
  // create-account gate on features anymore. The active-plans slot + Destaques
  // stat are Pro-gated too (plans/highlights are Pro).
  const isPro = useIsPro();

  // Verse of the day — a random pick from the curated reference pool (stable per
  // mount), with its text + reference label resolved from the bundled DB in the
  // reader's current translation (so it matches what the user reads, in-language).
  const verseRef = useMemo(() => pickRandomVerseRef(), []);
  const votdVerseQuery = useVerse(translationId, verseRef.bookId, verseRef.chapter, verseRef.verse);
  const { data: votdBookName } = useBookName(translationId, verseRef.bookId);
  const verseText = votdVerseQuery.data?.text ?? '';
  const verseLoading = votdVerseQuery.isLoading;
  const verseOfTheDay = useMemo(
    () => ({
      bookId: verseRef.bookId,
      chapter: verseRef.chapter,
      verse: verseRef.verse,
      ref: `${votdBookName ?? ''} ${verseRef.chapter}.${verseRef.verse}`.trim(),
    }),
    [verseRef, votdBookName]
  );

  // AI — Devotional
  const [devotionalVisible, setDevotionalVisible] = useState(false);
  const devotionalQuery = useAiGenerate({
    translationId,
    bookId: verseOfTheDay.bookId,
    chapter: verseOfTheDay.chapter,
    verseStart: verseOfTheDay.verse,
    verseEnd: verseOfTheDay.verse,
    promptType: 'devotional',
    passageText: verseText,
    locale: locale as 'en' | 'es' | 'pt',
    reference: verseOfTheDay.ref,
    enabled: devotionalVisible && isPro && verseText.length > 0,
  });

  // Greeting — one time bucket drives the welcome-card scene + its copy.
  const timeOfDay = getTimeOfDay();
  // const timeOfDay = 'morning' as TimeOfDay; // TODO: re-enable time-of-day greeting when the design is ready for it
  const greetingKey = GREETING_KEY[timeOfDay];
  const subtitleKey = SUBTITLE_KEY[timeOfDay];

  // Stats — local-first reading tracking (works for guests and signed-in users).
  // Highlights count is real for signed-in users; guests have none (highlighting
  // is account-gated — see the Study tab).
  const readChapters = useReadingProgressStore((s) => s.readChapters);
  const readDays = useReadingProgressStore((s) => s.readDays);
  const highlightCount = useCurrentUserHighlights().length;
  const stats = useMemo(
    () => ({
      progressPercent: Math.round((Object.keys(readChapters).length / TOTAL_BIBLE_CHAPTERS) * 100),
      streak: computeStreak(readDays),
      highlightCount,
    }),
    [readChapters, readDays, highlightCount]
  );

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleContinueReading = () => {
    router.push('/(tabs)/reader');
  };

  const handleVerseOfTheDay = () => {
    useReaderStore.getState().setPosition(verseOfTheDay.bookId, verseOfTheDay.chapter);
    router.push('/(tabs)/reader');
  };

  const handleExplorePlans = () => {
    router.push('/(tabs)/plans');
  };

  const handleSignIn = () => {
    router.push('/register');
  };

  const handleOpenPlan = (planId: string) => {
    router.push(`/(tabs)/plans/${planId}`);
  };

  const handleOpenPaywall = () => {
    router.push('/paywall');
  };

  const handleOpenDevotional = useCallback(() => {
    if (!isPro) {
      router.push('/paywall');
      return;
    }
    setDevotionalVisible(true);
  }, [isPro, router]);

  const closeDevotionalSheet = useCallback(() => setDevotionalVisible(false), []);

  return {
    translate,
    isAuthenticated,
    isPro,
    showProCta: !isPro,
    timeOfDay,
    greetingKey,
    subtitleKey,
    verseOfTheDay,
    verseText,
    verseLoading,
    bookName: bookName ?? '',
    chapter,
    translationLabel,
    stats,
    activePlans,
    handleContinueReading,
    handleVerseOfTheDay,
    handleExplorePlans,
    handleSignIn,
    handleOpenPlan,
    handleOpenPaywall,
    devotionalVisible,
    devotionalContent: devotionalQuery.data?.content ?? null,
    devotionalLoading: devotionalQuery.isFetching,
    devotionalError: devotionalQuery.error as AiGenerateError | null,
    handleOpenDevotional,
    closeDevotionalSheet,
    retryDevotional: devotionalQuery.refetch,
  };
}
