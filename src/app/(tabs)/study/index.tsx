import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Bookmark, Highlighter, NotebookPen } from 'lucide-react-native';
import { SafeAreaView, Text, TextVariants } from '@/components/atoms';
import { SegmentedControl, type Segment } from '@/components/molecules';
import { SignInPromptCard } from '@/components/organisms';
import { highlights as HIGHLIGHT_HEX } from '@/theme/colors';
import useStudyScreen, { type StudyFilter, type StudyItem } from './use-study-screen';

export default function StudyScreen() {
  const { translate, isAuthenticated, filter, setFilter, items, isLoading, isError, handleSignIn, handleOpenItem } =
    useStudyScreen();

  const segments: Segment<StudyFilter>[] = [
    { key: 'all', label: translate('study.filters.all') },
    { key: 'highlights', label: translate('study.filters.highlights') },
    { key: 'notes', label: translate('study.filters.notes') },
    { key: 'bookmarks', label: translate('study.filters.bookmarks') },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text variant={TextVariants.Title1} style={styles.heading}>
          {translate('study.title')}
        </Text>

        {!isAuthenticated ? (
          <SignInPromptCard
            icon={Highlighter}
            title={translate('study.signIn.title')}
            description={translate('study.signIn.description')}
            actionLabel={translate('study.signIn.action')}
            onPress={handleSignIn}
          />
        ) : (
          <>
            <SegmentedControl segments={segments} value={filter} onChange={setFilter} />

            {isLoading ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={styles.accent.color} />
              </View>
            ) : isError ? (
              <Text variant={TextVariants.Callout} color="textSecondary">
                {translate('study.loadError')}
              </Text>
            ) : items.length === 0 ? (
              <Text variant={TextVariants.Callout} color="textSecondary" style={styles.empty}>
                {translate(`study.empty.${filter}`)}
              </Text>
            ) : (
              <View style={styles.list}>
                {items.map((item) => (
                  <StudyCard key={item.key} item={item} onPress={() => handleOpenItem(item)} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StudyCard({ item, onPress }: { item: StudyItem; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <View style={styles.leading}>
        {item.type === 'highlight' && item.color ? (
          <View style={[styles.colorDot, { backgroundColor: HIGHLIGHT_HEX[item.color] }]} />
        ) : item.type === 'bookmark' ? (
          <Bookmark size={16} color={styles.iconAccent.color} strokeWidth={2} fill={styles.iconAccent.color} />
        ) : (
          <NotebookPen size={16} color={styles.iconAccent.color} strokeWidth={2} />
        )}
      </View>
      <View style={styles.cardBody}>
        <Text variant={TextVariants.Label} color="accent">
          {item.reference}
        </Text>
        {item.type === 'note' ? (
          <>
            <Text variant={TextVariants.Callout} numberOfLines={3}>
              {item.body}
            </Text>
            <Text variant={TextVariants.Caption} color="textTertiary" numberOfLines={1}>
              {item.text}
            </Text>
          </>
        ) : (
          <Text variant={TextVariants.Callout} color="textSecondary" numberOfLines={3}>
            {item.text}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.semantic.bgSecondary,
  },
  content: {
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[3],
    paddingBottom: theme.spacing[8],
    gap: theme.spacing[4],
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
  iconAccent: {
    color: theme.colors.semantic.accent,
  },
  empty: {
    marginTop: theme.spacing[2],
  },
  list: {
    gap: theme.spacing[3],
  },
  card: {
    flexDirection: 'row',
    gap: theme.spacing[3],
    backgroundColor: theme.colors.semantic.bgPrimary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing[4],
    ...theme.shadows.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  leading: {
    width: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: theme.radius.full,
  },
  cardBody: {
    flex: 1,
    gap: theme.spacing[1],
  },
}));
