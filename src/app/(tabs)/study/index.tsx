import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { StyleSheet } from 'react-native-unistyles';
import { Highlighter } from 'lucide-react-native';
import { SafeAreaView, Text, TEXT_VARIANTS } from '@/components/atoms';
import { SegmentedControl, type Segment } from '@/components/molecules';
import { SignInPromptCard, StudyCard } from '@/components/organisms';
import useStudyScreen, { type StudyFilter, type StudyItem } from './use-study-screen';

export default function StudyScreen() {
  const {
    translate,
    isAuthenticated,
    filter,
    setFilter,
    items,
    isLoading,
    isError,
    isRefetching,
    refresh,
    handleSignIn,
    handleOpenItem,
  } = useStudyScreen();

  const listRef = useRef<FlashListRef<StudyItem>>(null);

  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [filter]);

  const segments: Segment<StudyFilter>[] = [
    { key: 'all', label: translate('study.filters.all') },
    { key: 'highlights', label: translate('study.filters.highlights') },
    { key: 'notes', label: translate('study.filters.notes') },
    { key: 'bookmarks', label: translate('study.filters.bookmarks') },
  ];

  if (!isAuthenticated) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.content}>
          <Text variant={TEXT_VARIANTS.Title1} style={styles.heading}>
            {translate('study.title')}
          </Text>
          <SignInPromptCard
            icon={Highlighter}
            title={translate('study.signIn.title')}
            description={translate('study.signIn.description')}
            actionLabel={translate('study.signIn.action')}
            onPress={handleSignIn}
          />
        </View>
      </SafeAreaView>
    );
  }

  const listEmpty = isLoading ? (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={styles.accent.color} />
    </View>
  ) : isError ? (
    <Text variant={TEXT_VARIANTS.Callout} color="textSecondary">
      {translate('study.loadError')}
    </Text>
  ) : (
    <Text variant={TEXT_VARIANTS.Callout} color="textSecondary" style={styles.empty}>
      {translate(`study.empty.${filter}`)}
    </Text>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.header}>
        <Text variant={TEXT_VARIANTS.Title1} style={styles.heading}>
          {translate('study.title')}
        </Text>
        <SegmentedControl segments={segments} value={filter} onChange={setFilter} />
      </View>
      <FlashList<StudyItem>
        ref={listRef}
        data={items}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => <StudyCard item={item} onPress={() => handleOpenItem(item)} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onRefresh={refresh}
        refreshing={isRefetching}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.semantic.bgSecondary,
  },
  header: {
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[3],
    paddingBottom: theme.spacing[2],
  },
  content: {
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[3],
    paddingBottom: theme.spacing[8],
  },
  listContent: {
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[3],
    paddingBottom: theme.spacing[8],
  },
  heading: {
    marginBottom: theme.spacing[2],
  },
  centered: {
    paddingTop: theme.spacing[10],
    alignItems: 'center',
  },
  accent: {
    color: theme.colors.semantic.accent,
  },
  empty: {
    marginTop: theme.spacing[2],
  },
  separator: {
    height: theme.spacing[3],
  },
}));
