import { useRef, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { Search, X } from 'lucide-react-native';
import { Input, SafeAreaView, TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { useBooks, useChapters } from '@/hooks/use-bible';
import { useTranslate } from '@/i18n';
import { filterBooks } from '@/lib/book-search';
import type { TranslationId, Book } from '@/types/bible';

const ThemedX = withUnistyles(X, (theme) => ({ color: theme.colors.semantic.textSecondary }));
const ThemedSearch = withUnistyles(Search, (theme) => ({ color: theme.colors.semantic.textSecondary }));

type Props = {
  visible: boolean;
  translationId: TranslationId;
  currentBookId: number;
  currentChapter: number;
  onSelect: (bookId: number, chapter: number) => void;
  onClose: () => void;
};

export function BookChapterPicker({ visible, translationId, currentBookId, currentChapter, onSelect, onClose }: Props) {
  const translate = useTranslate();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [query, setQuery] = useState('');
  const bookListRef = useRef<FlashListRef<Book>>(null);

  const { data: books = [] } = useBooks(translationId);
  const filteredBooks = filterBooks(books, query);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    bookListRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const handleClose = () => {
    setSelectedBook(null);
    setQuery('');
    onClose();
  };

  const handleSubmitSearch = () => {
    const [firstMatch] = filteredBooks;
    if (query.trim() && firstMatch) setSelectedBook(firstMatch);
  };

  const handleBookPress = (book: Book) => {
    setSelectedBook(book);
  };

  const handleChapterPress = (chapter: number) => {
    if (selectedBook) {
      onSelect(selectedBook.id, chapter);
      setSelectedBook(null);
      setQuery('');
    }
  };

  const handleBack = () => {
    setSelectedBook(null);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={selectedBook ? handleBack : handleClose} hitSlop={8}>
            <Text variant={TEXT_VARIANTS.Callout} color={TEXT_COLORS.Accent}>
              {selectedBook ? translate('reader.back') : translate('reader.close')}
            </Text>
          </Pressable>
          <Text variant={TEXT_VARIANTS.Title3} style={styles.headerTitle}>
            {selectedBook ? selectedBook.name : translate('reader.books')}
          </Text>
          <Pressable onPress={handleClose} hitSlop={8}>
            <ThemedX size={22} />
          </Pressable>
        </View>

        {selectedBook ? (
          <ChapterGrid
            translationId={translationId}
            bookId={selectedBook.id}
            currentChapter={selectedBook.id === currentBookId ? currentChapter : -1}
            onSelect={handleChapterPress}
          />
        ) : (
          <>
            <View style={styles.searchContainer}>
              <Input
                value={query}
                onChangeText={handleQueryChange}
                placeholder={translate('reader.searchBooks')}
                accessibilityLabel={translate('reader.searchBooks')}
                leftIcon={<ThemedSearch size={18} />}
                rightIcon={
                  query ? (
                    <Pressable
                      onPress={() => handleQueryChange('')}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={translate('reader.clearSearch')}
                    >
                      <ThemedX size={18} />
                    </Pressable>
                  ) : undefined
                }
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
                clearButtonMode="never"
                onSubmitEditing={handleSubmitSearch}
              />
            </View>
            <FlashList
              ref={bookListRef}
              data={filteredBooks}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.listContent}
              maintainVisibleContentPosition={{ disabled: true }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              ListEmptyComponent={
                <Text variant={TEXT_VARIANTS.Callout} color={TEXT_COLORS.TextSecondary} style={styles.emptyText}>
                  {translate('reader.noBooksFound', { query: query.trim() })}
                </Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleBookPress(item)}
                  style={({ pressed }) => [
                    styles.bookRow,
                    item.id === currentBookId && styles.activeRow,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text variant={TEXT_VARIANTS.Body} style={item.id === currentBookId ? styles.activeText : undefined}>
                    {item.name}
                  </Text>
                </Pressable>
              )}
            />
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}

function ChapterGrid({
  translationId,
  bookId,
  currentChapter,
  onSelect,
}: {
  translationId: TranslationId;
  bookId: number;
  currentChapter: number;
  onSelect: (chapter: number) => void;
}) {
  const { data: chapters = [] } = useChapters(translationId, bookId);

  return (
    <FlashList
      data={chapters}
      keyExtractor={(item) => String(item.chapter)}
      numColumns={5}
      contentContainerStyle={styles.gridContent}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => onSelect(item.chapter)}
          style={({ pressed }) => [
            styles.chapterCell,
            item.chapter === currentChapter && styles.activeCell,
            pressed && styles.pressed,
          ]}
        >
          <Text
            variant={TEXT_VARIANTS.Body}
            style={item.chapter === currentChapter ? styles.activeCellText : undefined}
          >
            {item.chapter}
          </Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.semantic.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[6],
    paddingBottom: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.semantic.bgTertiary,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[3],
  },
  emptyText: {
    textAlign: 'center',
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[6],
  },
  listContent: {
    paddingVertical: theme.spacing[2],
  },
  bookRow: {
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[3],
  },
  activeRow: {
    backgroundColor: theme.colors.semantic.accentSubtle,
  },
  activeText: {
    color: theme.colors.semantic.accent,
    fontWeight: theme.font.weights.semibold,
  },
  pressed: {
    opacity: 0.6,
  },
  gridContent: {
    padding: theme.spacing[4],
  },
  chapterCell: {
    flex: 1,
    aspectRatio: 1,
    margin: theme.spacing[1],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.semantic.bgSecondary,
  },
  activeCell: {
    backgroundColor: theme.colors.semantic.accent,
  },
  activeCellText: {
    color: '#FFFFFF',
    fontWeight: theme.font.weights.semibold,
  },
}));
