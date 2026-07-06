import { useCallback } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { Check } from 'lucide-react-native';
import { Button, SafeAreaView, TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { ReaderHeader, ChapterNavBar } from '@/components/molecules';
import {
  AiExplainSheet,
  AiPrayerSheet,
  ChapterSummarySheet,
  PlanDayCompleteModal,
  BookChapterPicker,
  NoteEditorModal,
  TranslationPicker,
  VerseActionSheet,
} from '@/components/organisms';
import { useReaderStore } from '@/stores/reader';
import { useTranslate } from '@/i18n';
import { highlights as HIGHLIGHT_HEX } from '@/theme/colors';
import { typography } from '@/theme/typography';
import type { Verse } from '@/types/bible';
import useReaderScreen from './use-reader-screen';
import { BUTTON_SIZES } from '@/components/atoms/Button';

const ThemedActivityIndicator = withUnistyles(ActivityIndicator, (theme) => ({ color: theme.colors.semantic.accent }));
const ThemedCheck = withUnistyles(Check, (theme) => ({ color: theme.colors.semantic.bgPrimary }));

export default function ReaderScreen() {
  const {
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
    isFinishingPlanDay,
    handleFinishPlanDay,
    planComplete,
    handlePlanCompleteContinue,
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
    explainVerse,
    explainMode,
    explainContent,
    explainLoading,
    explainError,
    handleOpenExplain,
    handleToggleExplainMode,
    closeExplainSheet,
    retryExplain,
    summaryVisible,
    summaryContent,
    summaryLoading,
    summaryError,
    handleOpenSummary,
    closeSummarySheet,
    retrySummary,
    prayerVerse,
    prayerContent,
    prayerLoading,
    prayerError,
    handleOpenPray,
    closePrayerSheet,
    retryPrayer,
  } = useReaderScreen();
  const t = useTranslate();

  const fontSize = useReaderStore((s) => s.fontSize);
  const readerFontSize = typography.reader.sizes[fontSize];
  const readerLineHeight = readerFontSize * typography.reader.lineHeightMultipliers[fontSize];

  const renderVerse = useCallback(
    ({ item }: { item: Verse }) => {
      const color = chapterHighlights[item.verse];
      const content = (
        <>
          <Text variant={TEXT_VARIANTS.Caption} color={TEXT_COLORS.TextTertiary} style={styles.verseNumber}>
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
        </>
      );

      // Verse study actions are Pro. For non-Pro users the verse is plain, non-
      // interactive text (no press, no feedback) — reading itself stays free.
      if (!isPro) {
        return <View style={styles.verseRow}>{content}</View>;
      }

      return (
        <Pressable onPress={() => handleVersePress(item.verse)} style={styles.verseRow}>
          {content}
        </Pressable>
      );
    },
    [readerFontSize, readerLineHeight, chapterHighlights, handleVersePress, isPro]
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
        icon={<ThemedCheck size={18} strokeWidth={3} />}
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
          <ThemedActivityIndicator size="large" />
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

      <ChapterNavBar
        bookName={bookName}
        chapter={chapter}
        onPrev={handlePrevChapter}
        onNext={handleNextChapter}
        onSummary={isPro ? handleOpenSummary : undefined}
      />

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
        onExplain={handleOpenExplain}
        onPray={handleOpenPray}
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

      <AiExplainSheet
        visible={explainVerse != null}
        reference={`${bookName ?? ''} ${chapter}:${explainVerse ?? ''}`}
        promptType={explainMode}
        content={explainContent}
        isLoading={explainLoading}
        error={explainError}
        onClose={closeExplainSheet}
        onSwitchMode={handleToggleExplainMode}
        onRetry={retryExplain}
      />

      <ChapterSummarySheet
        visible={summaryVisible}
        chapterLabel={`${bookName ?? ''} ${chapter}`}
        content={summaryContent}
        isLoading={summaryLoading}
        error={summaryError}
        onClose={closeSummarySheet}
        onRetry={retrySummary}
      />

      <AiPrayerSheet
        visible={prayerVerse != null}
        reference={`${bookName ?? ''} ${chapter}:${prayerVerse ?? ''}`}
        content={prayerContent}
        isLoading={prayerLoading}
        error={prayerError}
        onClose={closePrayerSheet}
        onRetry={retryPrayer}
      />

      <PlanDayCompleteModal
        visible={planComplete != null}
        title={t(planComplete?.finished ? 'plans.completed.planTitle' : 'plans.completed.dayTitle')}
        body={t(planComplete?.finished ? 'plans.completed.planBody' : 'plans.completed.dayBody')}
        ctaLabel={t('plans.completed.cta')}
        onContinue={handlePlanCompleteContinue}
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
}));
