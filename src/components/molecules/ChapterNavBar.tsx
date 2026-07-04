import { Pressable, View } from 'react-native';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react-native';
import { Button, Text, TEXT_VARIANTS } from '@/components/atoms';
import { BUTTON_SIZES, BUTTON_VARIANTS } from '@/components/atoms/Button';
import { useTranslate } from '@/i18n';

const ThemedChevronLeft = withUnistyles(ChevronLeft, (theme) => ({ color: theme.colors.semantic.accent }));
const ThemedChevronRight = withUnistyles(ChevronRight, (theme) => ({ color: theme.colors.semantic.accent }));
const ThemedSparkles = withUnistyles(Sparkles, (theme) => ({ color: theme.colors.semantic.textSecondary }));

type ChapterNavBarProps = {
  bookName: string | undefined;
  chapter: number;
  onPrev: () => void;
  onNext: () => void;
  onSummary?: () => void;
};

export function ChapterNavBar({ bookName, chapter, onPrev, onNext, onSummary }: ChapterNavBarProps) {
  const translate = useTranslate();

  return (
    <View style={styles.navBar}>
      <Pressable onPress={onPrev} style={styles.navButton} hitSlop={8}>
        <ThemedChevronLeft size={22} />
        <Text variant={TEXT_VARIANTS.Label} color="accent">
          {translate('reader.prev')}
        </Text>
      </Pressable>

      {onSummary ? (
        <Button
          onPress={onSummary}
          label={`${bookName} ${chapter}`}
          icon={<ThemedSparkles size={16} strokeWidth={1.5} />}
          iconPosition="right"
          variant={BUTTON_VARIANTS.Ghost}
          size={BUTTON_SIZES.Medium}
        />
      ) : (
        <Text variant={TEXT_VARIANTS.Label} color="textSecondary">
          {bookName} {chapter}
        </Text>
      )}

      <Pressable onPress={onNext} style={styles.navButton} hitSlop={8}>
        <Text variant={TEXT_VARIANTS.Label} color="accent">
          {translate('reader.next')}
        </Text>
        <ThemedChevronRight size={22} strokeWidth={1.5} />
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
}));
