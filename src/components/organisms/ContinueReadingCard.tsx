import { View, type ViewStyle } from 'react-native';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { BookOpen } from 'lucide-react-native';
import { TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { PressableCard } from '../molecules';

const ThemedBookOpen = withUnistyles(BookOpen, (theme) => ({ color: theme.colors.semantic.accent }));

type ContinueReadingCardProps = {
  title: string;
  bookName: string;
  chapter: number;
  translationLabel: string;
  progressPercent: number;
  onPress: () => void;
};

export function ContinueReadingCard({
  title,
  bookName,
  chapter,
  translationLabel,
  progressPercent,
  onPress,
}: ContinueReadingCardProps) {
  return (
    <PressableCard onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <ThemedBookOpen size={20} strokeWidth={2} />
        </View>
        <View style={styles.body}>
          <Text variant={TEXT_VARIANTS.Overline} color={TEXT_COLORS.TextSecondary} style={styles.uppercase}>
            {title}
          </Text>
          <Text variant={TEXT_VARIANTS.BodyEmphasis}>
            {bookName} {chapter} · {translationLabel}
          </Text>
        </View>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPercent}%` } as ViewStyle]} />
      </View>
    </PressableCard>
  );
}

const styles = StyleSheet.create((theme) => ({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.semantic.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: theme.spacing[0.5],
  },
  uppercase: {
    textTransform: 'uppercase',
  },
  progressTrack: {
    height: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.semantic.bgTertiary,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.semantic.accent,
  },
}));
