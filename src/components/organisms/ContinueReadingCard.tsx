import { View, type ViewStyle } from 'react-native';
import { PressableScale } from 'pressto';
import { StyleSheet } from 'react-native-unistyles';
import { BookOpen } from 'lucide-react-native';
import { Text, TextVariants } from '@/components/atoms';

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
    <PressableScale onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <BookOpen size={20} color={styles.accentColor.color} strokeWidth={2} />
        </View>
        <View style={styles.body}>
          <Text variant={TextVariants.Overline} color="textSecondary" style={styles.uppercase}>
            {title}
          </Text>
          <Text variant={TextVariants.BodyEmphasis}>
            {bookName} {chapter} · {translationLabel}
          </Text>
        </View>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPercent}%` } as ViewStyle]} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.semantic.bgSecondary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing[5],
    gap: theme.spacing[3],
  },
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
  accentColor: {
    color: theme.colors.semantic.accent,
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
