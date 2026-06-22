import { useCallback } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, SafeAreaView } from '@/components/atoms';
import { ReaderHeader, ChapterNavBar } from '@/components/molecules';
import { BookChapterPicker, TranslationPicker } from '@/components/organisms';
import type { Verse } from '@/types/bible';
import useReaderScreen from './use-reader-screen';

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
    handlePrevChapter,
    handleNextChapter,
  } = useReaderScreen();

  const renderVerse = useCallback(
    ({ item }: { item: Verse }) => (
      <View style={styles.verseRow}>
        <Text variant="caption" color="textTertiary" style={styles.verseNumber}>
          {item.verse}
        </Text>
        <Text style={styles.verseText}>{item.text}</Text>
      </View>
    ),
    []
  );

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
        <FlatList
          data={verses}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderVerse}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
        onClose={() => setTranslationPickerVisible(false)}
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
    fontSize: theme.typography.reader.sizes.medium,
    lineHeight: theme.typography.reader.sizes.medium * theme.typography.reader.lineHeightMultipliers.medium,
    color: theme.colors.semantic.textPrimary,
  },
}));
