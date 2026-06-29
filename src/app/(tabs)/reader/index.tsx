import { useCallback } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { StyleSheet } from 'react-native-unistyles';
import { Check } from 'lucide-react-native';
import { Button, Text, TEXT_VARIANTS, SafeAreaView } from '@/components/atoms';
import { ReaderHeader, ChapterNavBar } from '@/components/molecules';
import { BookChapterPicker, NoteEditorModal, TranslationPicker, VerseActionSheet } from '@/components/organisms';
import { useReaderStore } from '@/stores/reader';
import { useTranslate } from '@/i18n';
import { highlights as HIGHLIGHT_HEX } from '@/theme/colors';
import { typography } from '@/theme/typography';
import type { Verse } from '@/types/bible';
import useReaderScreen from './use-reader-screen';
import { BUTTON_SIZES } from '@/components/atoms/Button';

export default function ReaderScreen() {
  const {
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
    isFinishingPlanDay,
    handleFinishPlanDay,
    chapterHighlights,
    selectedVerse,
    selectedVerseColor,
    handleVersePress,
    handlePickColor,
    handleRemoveHighlight,
    closeVerseSheet,
    selectedVerseBookmarked,
    handleToggleBookmark,
    selectedVerseHasNote,
    handleOpenNote,
    noteEditorVisible,
    noteEditorReference,
    noteEditorBody,
    noteEditorHasExisting,
    handleSaveNote,
    handleDeleteNote,
    closeNoteEditor,
  } = useReaderScreen();
  const t = useTranslate();

  const fontSize = useReaderStore((s) => s.fontSize);
  const readerFontSize = typography.reader.sizes[fontSize];
  const readerLineHeight = readerFontSize * typography.reader.lineHeightMultipliers[fontSize];

  const renderVerse = useCallback(
    ({ item }: { item: Verse }) => {
      const color = chapterHighlights[item.verse];
      return (
        <Pressable onPress={() => handleVersePress(item.verse)} style={styles.verseRow}>
          <Text variant={TEXT_VARIANTS.Caption} color="textTertiary" style={styles.verseNumber}>
            {item.verse}
          </Text>
          <Text
            style={[
              styles.verseText,
              { fontSize: readerFontSize, lineHeight: readerLineHeight },
              // Fixed dark text on the pastel highlight keeps it readable in every theme.
              color ? { backgroundColor: HIGHLIGHT_HEX[color], color: '#1A1A1A' } : null,
            ]}
          >
            {item.text}
          </Text>
        </Pressable>
      );
    },
    [readerFontSize, readerLineHeight, chapterHighlights, handleVersePress]
  );

  // When reading a plan day, a "finish today's reading" CTA sits at the end of
  // the passage — only seen after scrolling through, so it confirms a read.
  const listFooter = isPlanDayEnd ? (
    <View style={styles.planFooter}>
      <Button
        size={BUTTON_SIZES.Large}
        fullWidth
        label={t('plans.reading.finishButton')}
        onPress={handleFinishPlanDay}
        disabled={isFinishingPlanDay}
        icon={<Check size={18} color={styles.planFooterIcon.color} strokeWidth={3} />}
      />
    </View>
  ) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ReaderHeader
        bookName={bookName}
        chapter={chapter}
        translationId={translationId}
        onBookPress={() => setBookPickerVisible(true)}
        onTranslationPress={() => setTranslationPickerVisible(true)}
      />

      {/* Verse List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={styles.accentColor.color} />
        </View>
      ) : (
        <FlashList
          data={verses ?? []}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderVerse}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={listFooter}
        />
      )}

      <ChapterNavBar bookName={bookName} chapter={chapter} onPrev={handlePrevChapter} onNext={handleNextChapter} />

      <BookChapterPicker
        visible={bookPickerVisible}
        translationId={translationId}
        currentBookId={bookId}
        currentChapter={chapter}
        onSelect={handleBookChapterSelect}
        onClose={() => setBookPickerVisible(false)}
      />

      <TranslationPicker
        visible={translationPickerVisible}
        currentId={translationId}
        onSelect={handleTranslationSelect}
        onUpsell={handleTranslationUpsell}
        onClose={() => setTranslationPickerVisible(false)}
      />

      <VerseActionSheet
        visible={selectedVerse != null}
        reference={`${bookName ?? ''} ${chapter}:${selectedVerse ?? ''}`}
        currentColor={selectedVerseColor}
        onPick={handlePickColor}
        onRemove={handleRemoveHighlight}
        onClose={closeVerseSheet}
        isBookmarked={selectedVerseBookmarked}
        onToggleBookmark={handleToggleBookmark}
        hasNote={selectedVerseHasNote}
        onOpenNote={handleOpenNote}
      />

      <NoteEditorModal
        key={noteEditorReference}
        visible={noteEditorVisible}
        reference={noteEditorReference}
        initialBody={noteEditorBody}
        hasExistingNote={noteEditorHasExisting}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
        onClose={closeNoteEditor}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.semantic.bgSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accentColor: {
    color: theme.colors.semantic.accent,
  },
  listContent: {
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[4],
  },
  verseRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing[2],
  },
  verseNumber: {
    width: 28,
    textAlign: 'right',
    marginRight: theme.spacing[2],
    marginTop: 3,
  },
  verseText: {
    flex: 1,
    fontFamily: theme.typography.reader.families.serif,
    color: theme.colors.semantic.textPrimary,
  },
  planFooter: {
    marginTop: theme.spacing[6],
    paddingTop: theme.spacing[4],
    borderTopWidth: 1,
    borderTopColor: theme.colors.semantic.bgTertiary,
  },
  planFooterIcon: {
    color: theme.colors.semantic.bgPrimary,
  },
}));
