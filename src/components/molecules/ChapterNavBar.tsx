import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Text, TextVariants } from '@/components/atoms';
import { useTranslate } from '@/i18n';

type ChapterNavBarProps = {
  bookName: string | undefined;
  chapter: number;
  onPrev: () => void;
  onNext: () => void;
};

export function ChapterNavBar({ bookName, chapter, onPrev, onNext }: ChapterNavBarProps) {
  const translate = useTranslate();

  return (
    <View style={styles.navBar}>
      <Pressable onPress={onPrev} style={styles.navButton} hitSlop={8}>
        <ChevronLeft size={22} color={styles.chevron.color} />
        <Text variant={TextVariants.Label} color="accent">
          {translate('reader.prev')}
        </Text>
      </Pressable>

      <Text variant={TextVariants.Label} color="textSecondary">
        {bookName} {chapter}
      </Text>

      <Pressable onPress={onNext} style={styles.navButton} hitSlop={8}>
        <Text variant={TextVariants.Label} color="accent">
          {translate('reader.next')}
        </Text>
        <ChevronRight size={22} color={styles.chevron.color} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[6],
    borderTopWidth: 1,
    borderTopColor: theme.colors.semantic.bgTertiary,
    backgroundColor: theme.colors.semantic.bgPrimary,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
  },
  chevron: {
    color: theme.colors.semantic.accent,
  },
}));
