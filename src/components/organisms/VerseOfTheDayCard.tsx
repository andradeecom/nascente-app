import { View } from 'react-native';
import { PressableScale } from 'pressto';
import { StyleSheet } from 'react-native-unistyles';
import { ChevronRight } from 'lucide-react-native';
import { Text, TEXT_VARIANTS } from '@/components/atoms';

type VerseOfTheDayCardProps = {
  title: string;
  verseText: string;
  reference: string;
  actionLabel: string;
  onPress: () => void;
};

export function VerseOfTheDayCard({ title, verseText, reference, actionLabel, onPress }: VerseOfTheDayCardProps) {
  return (
    <PressableScale onPress={onPress} style={styles.card}>
      <Text variant={TEXT_VARIANTS.Overline} color="accent" style={styles.uppercase}>
        {title}
      </Text>
      <Text variant={TEXT_VARIANTS.BodyEmphasis} style={styles.verseText}>
        {verseText}
      </Text>
      <View style={styles.footer}>
        <Text variant={TEXT_VARIANTS.Callout} color="textSecondary">
          {reference}
        </Text>
        <View style={styles.action}>
          <Text variant={TEXT_VARIANTS.Label} color="accent">
            {actionLabel}
          </Text>
          <ChevronRight size={16} color={styles.accentColor.color} strokeWidth={2} />
        </View>
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
