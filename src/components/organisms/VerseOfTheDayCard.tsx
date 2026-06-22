import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { ChevronRight } from 'lucide-react-native';
import { Text, TextVariants } from '@/components/atoms';

type VerseOfTheDayCardProps = {
  title: string;
  verseText: string;
  reference: string;
  actionLabel: string;
  onPress: () => void;
};

export function VerseOfTheDayCard({ title, verseText, reference, actionLabel, onPress }: VerseOfTheDayCardProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Text variant={TextVariants.Overline} color="accent" style={styles.uppercase}>
        {title}
      </Text>
      <Text variant={TextVariants.BodyEmphasis} style={styles.verseText}>
        {verseText}
      </Text>
      <View style={styles.footer}>
        <Text variant={TextVariants.Callout} color="textSecondary">
          {reference}
        </Text>
        <View style={styles.action}>
          <Text variant={TextVariants.Label} color="accent">
            {actionLabel}
          </Text>
          <ChevronRight size={16} color={styles.accentColor.color} strokeWidth={2} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.semantic.bgSecondary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing[5],
    gap: theme.spacing[3],
  },
  pressed: {
    opacity: 0.85,
  },
  uppercase: {
    textTransform: 'uppercase',
  },
  verseText: {
    fontFamily: 'Literata',
    lineHeight: 30,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
  },
  accentColor: {
    color: theme.colors.semantic.accent,
  },
}));
