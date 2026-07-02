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
import { useBookName } from '@/hooks/use-bible';
import { useActivePlans } from '@/hooks/use-reading-plans';
import { useAiGenerate } from '@/hooks/use-ai-generate';
import { TOTAL_BIBLE_CHAPTERS, TRANSLATIONS } from '@/types/bible';
import type { AiGenerateError } from '@/types/ai';

// ── Verse of the day ────────────────────────────────────────────────────────

type VerseOfTheDay = {
  bookId: number;
  chapter: number;
  verse: number;
  textPt: string;
  textEs: string;
  textEn: string;
  ref: string;
};

const VERSES_OF_THE_DAY: VerseOfTheDay[] = [
  {
    bookId: 43,
    chapter: 1,
    verse: 1,
    textPt: 'No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus.',
    textEs: 'En el principio era el Verbo, y el Verbo era con Dios, y el Verbo era Dios.',
    textEn: 'In the beginning was the Word, and the Word was with God, and the Word was God.',
    ref: 'João 1.1',
  },
  {
    bookId: 19,
    chapter: 23,
    verse: 1,
    textPt: 'O Senhor é o meu pastor; nada me faltará.',
    textEs: 'Jehová es mi pastor; nada me faltará.',
    textEn: 'The Lord is my shepherd; I shall not want.',
    ref: 'Salmos 23.1',
  },
  {
    bookId: 20,
    chapter: 3,
    verse: 5,
    textPt: 'Confia no Senhor de todo o teu coração, e não te estribes no teu próprio entendimento.',
    textEs: 'Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia.',
    textEn: 'Trust in the Lord with all thine heart; and lean not unto thine own understanding.',
    ref: 'Provérbios 3.5',
  },
  {
    bookId: 23,
    chapter: 40,
    verse: 31,
    textPt: 'Mas os que esperam no Senhor renovarão as suas forças; subirão com asas como águias.',
    textEs: 'Pero los que esperan a Jehová tendrán nuevas fuerzas; levantarán alas como las águilas.',
    textEn: 'But they that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles.',
    ref: 'Isaías 40.31',
  },
  {
    bookId: 50,
    chapter: 4,
    verse: 13,
    textPt: 'Posso todas as coisas naquele que me fortalece.',
    textEs: 'Todo lo puedo en Cristo que me fortalece.',
    textEn: 'I can do all things through Christ which strengtheneth me.',
    ref: 'Filipenses 4.13',
  },
  {
    bookId: 45,
    chapter: 8,
    verse: 28,
    textPt: 'E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus.',
    textEs: 'Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien.',
    textEn: 'And we know that all things work together for good to them that love God.',
    ref: 'Romanos 8.28',
  },
  {
    bookId: 24,
    chapter: 29,
    verse: 11,
    textPt:
      'Porque eu sei os planos que tenho para vós, diz o Senhor; planos de paz, e não de mal, para vos dar o fim que esperais.',
    textEs:
      'Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal.',
    textEn: 'For I know the thoughts that I think toward you, saith the Lord, thoughts of peace, and not of evil.',
    ref: 'Jeremias 29.11',
  },
];

function getVerseOfTheDay() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return VERSES_OF_THE_DAY[dayOfYear % VERSES_OF_THE_DAY.length];
}

// ── Time-of-day greeting ────────────────────────────────────────────────────

type GreetingKey = 'home.greetingMorning' | 'home.greetingAfternoon' | 'home.greetingEvening';

function getGreetingKey(): GreetingKey {
  const hour = new Date().getHours();
  if (hour < 12) return 'home.greetingMorning';
  if (hour < 18) return 'home.greetingAfternoon';
  return 'home.greetingEvening';
}

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

  // Verse of the day
  const verseOfTheDay = useMemo(() => getVerseOfTheDay(), []);
  const verseText =
    locale === 'es' ? verseOfTheDay.textEs : locale === 'en' ? verseOfTheDay.textEn : verseOfTheDay.textPt;

  // AI — Devotional
  const [devotionalVisible, setDevotionalVisible] = useState(false);
  const devotionalQuery = useAiGenerate({
    translationId: 'ONBV',
    bookId: verseOfTheDay.bookId,
    chapter: verseOfTheDay.chapter,
    verseStart: verseOfTheDay.verse,
    verseEnd: verseOfTheDay.verse,
    promptType: 'devotional',
    passageText: verseText,
    locale: locale as 'en' | 'es' | 'pt',
    enabled: devotionalVisible && isPro,
  });

  // Greeting
  const greetingKey = getGreetingKey();

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
    greetingKey,
    verseOfTheDay,
    verseText,
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
