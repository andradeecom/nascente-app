import { useCallback, useState } from 'react';
import { useVerses, useBookName } from '@/hooks/use-bible';
import { useReaderStore } from '@/stores/reader';
import { getMaxChapter } from '@/services/bible';
import type { TranslationId } from '@/types/bible';

export default function useReaderScreen() {
  const { translationId, bookId, chapter, setTranslation, setPosition, setChapter } = useReaderStore();

  const [bookPickerVisible, setBookPickerVisible] = useState(false);
  const [translationPickerVisible, setTranslationPickerVisible] = useState(false);

  const { data: verses, isLoading } = useVerses(translationId, bookId, chapter);
  const { data: bookName } = useBookName(translationId, bookId);

  const handleBookChapterSelect = useCallback(
    (newBookId: number, newChapter: number) => {
      setPosition(newBookId, newChapter);
      setBookPickerVisible(false);
    },
    [setPosition]
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
  };
}
