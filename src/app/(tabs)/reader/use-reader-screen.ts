import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useVerses, useBookName } from '@/hooks/use-bible';
import { useReaderStore } from '@/stores/reader';
import { usePlanReadingStore } from '@/stores/plan-reading';
import { useMarkPlanDayComplete } from '@/hooks/use-reading-plans';
import { useTranslate } from '@/i18n';
import { getMaxChapter } from '@/services/bible';
import type { TranslationId } from '@/types/bible';

export default function useReaderScreen() {
  const { translationId, bookId, chapter, setTranslation, setPosition, setChapter } = useReaderStore();
  const router = useRouter();
  const translate = useTranslate();

  const session = usePlanReadingStore((s) => s.session);
  const clearSession = usePlanReadingStore((s) => s.clearSession);
  const markComplete = useMarkPlanDayComplete();

  const [bookPickerVisible, setBookPickerVisible] = useState(false);
  const [translationPickerVisible, setTranslationPickerVisible] = useState(false);

  const { data: verses, isLoading } = useVerses(translationId, bookId, chapter);
  const { data: bookName } = useBookName(translationId, bookId);

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
    handlePrevChapter,
    handleNextChapter,
    isPlanDayEnd,
    isFinishingPlanDay: markComplete.isPending,
    handleFinishPlanDay,
  };
}
