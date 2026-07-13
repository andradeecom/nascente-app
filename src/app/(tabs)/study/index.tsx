import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { Bookmark, Highlighter, NotebookPen, Trash2, type LucideIcon } from 'lucide-react-native';
import { Button, SafeAreaView, TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { BUTTON_SIZES, BUTTON_VARIANTS } from '@/components/atoms/Button';
import { AppModal, SegmentedControl, type Segment } from '@/components/molecules';
import { ProLockCard, StudyCard, StudyEmptyState } from '@/components/organisms';
import useStudyScreen, { type StudyFilter, type StudyItem } from './use-study-screen';

// Per-tool icons (match the reader's VerseActionSheet: bookmark + note-pen; the
// highlighter mirrors the color-picker highlight action).
const EMPTY_ICON: Record<'highlights' | 'notes' | 'bookmarks', LucideIcon> = {
  highlights: Highlighter,
  notes: NotebookPen,
  bookmarks: Bookmark,
};

const ThemedTrash = withUnistyles(Trash2, (theme) => ({ color: theme.colors.semantic.danger }));

const ThemedActivityIndicator = withUnistyles(ActivityIndicator, (theme) => ({ color: theme.colors.semantic.accent }));

export default function StudyScreen() {
  const {
    translate,
    isPro,
    filter,
    setFilter,
    items,
    isLoading,
    isError,
    isRefetching,
    refresh,
    clearFilter,
    clearConfirmOpen,
    requestClearAll,
    cancelClearAll,
    confirmClearAll,
    handleUpgrade,
    handleOpenReader,
    handleOpenItem,
  } = useStudyScreen();

  const listRef = useRef<FlashListRef<StudyItem>>(null);

  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [filter]);

  const segments: Segment<StudyFilter>[] = [
    // { key: 'all', label: translate('study.filters.all') }, // IGNORE --- This filter is not currently used, but we may want to add it back in the future.
    { key: 'highlights', label: translate('study.filters.highlights') },
    { key: 'notes', label: translate('study.filters.notes') },
    { key: 'bookmarks', label: translate('study.filters.bookmarks') },
  ];

  if (!isPro) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.content}>
          <Text variant={TEXT_VARIANTS.Title1}>{translate('study.title')}</Text>
          <ProLockCard
            icon={NotebookPen}
            title={translate('study.proLock.title')}
            description={translate('study.proLock.description')}
            ctaLabel={translate('study.proLock.action')}
            onPress={handleUpgrade}
          />
        </View>
      </SafeAreaView>
    );
  }

  // The segmented control only offers highlights/notes/bookmarks, so `filter` is
  // always one of those here (never 'all') — pick the matching tool icon/copy.
  const emptyFilter = filter === 'all' ? 'highlights' : filter;

  const listEmpty = isLoading ? (
    <View style={styles.centered}>
      <ThemedActivityIndicator size="large" />
    </View>
  ) : isError ? (
    <View style={styles.centered}>
      <Text variant={TEXT_VARIANTS.Callout} color={TEXT_COLORS.TextSecondary}>
        {translate('study.loadError')}
      </Text>
    </View>
  ) : (
    <StudyEmptyState
      icon={EMPTY_ICON[emptyFilter]}
      title={translate(`study.empty.${emptyFilter}.title`)}
      description={translate(`study.empty.${emptyFilter}.description`)}
      ctaLabel={translate(`study.empty.${emptyFilter}.action`)}
      onPress={handleOpenReader}
    />
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text variant={TEXT_VARIANTS.Title1}>{translate('study.title')}</Text>
        <SegmentedControl segments={segments} value={filter} onChange={setFilter} />
      </View>
      <FlashList<StudyItem>
        ref={listRef}
        data={items}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => <StudyCard item={item} onPress={() => handleOpenItem(item)} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={
          clearFilter ? (
            <View style={styles.footer}>
              <Button
                variant={BUTTON_VARIANTS.Ghost}
                size={BUTTON_SIZES.Small}
                label={translate(`study.clearAll.action.${clearFilter}`)}
                icon={<ThemedTrash size={16} strokeWidth={2} />}
                onPress={requestClearAll}
              />
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onRefresh={refresh}
        refreshing={isRefetching}
      />

      <AppModal visible={clearConfirmOpen && clearFilter != null} onClose={cancelClearAll}>
        {clearFilter ? (
          <View style={styles.confirm}>
            <Text variant={TEXT_VARIANTS.Title3} style={styles.confirmText}>
              {translate(`study.clearAll.title.${clearFilter}`)}
            </Text>
            <Text variant={TEXT_VARIANTS.Callout} color={TEXT_COLORS.TextSecondary} style={styles.confirmText}>
              {translate(`study.clearAll.message.${clearFilter}`)}
            </Text>
            <Button
              variant={BUTTON_VARIANTS.Destructive}
              label={translate('study.clearAll.confirm')}
              onPress={confirmClearAll}
              fullWidth
              style={styles.confirmButton}
            />
            <Button
              variant={BUTTON_VARIANTS.Ghost}
              label={translate('study.clearAll.cancel')}
              onPress={cancelClearAll}
              fullWidth
            />
          </View>
        ) : null}
      </AppModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.semantic.bgSecondary,
    paddingHorizontal: theme.spacing[3],
    gap: theme.spacing[3],
  },
  header: {
    paddingTop: theme.spacing[3],
    gap: theme.spacing[3],
  },
  footer: {
    marginTop: theme.spacing[6],
    alignItems: 'center',
  },
  content: {
    paddingTop: theme.spacing[3],
    gap: theme.spacing[6],
  },
  listContent: {
    paddingTop: theme.spacing[3],
    paddingBottom: theme.spacing[24],
    paddingHorizontal: theme.spacing[2],
  },
  centered: {
    alignItems: 'center',
  },
  separator: {
    height: theme.spacing[3],
  },
  confirm: {
    gap: theme.spacing[3],
  },
  confirmText: {
    textAlign: 'center',
  },
  confirmButton: {
    marginTop: theme.spacing[2],
  },
}));
