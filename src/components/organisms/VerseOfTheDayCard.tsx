import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { ChevronRight } from 'lucide-react-native';
import { Text, TEXT_VARIANTS } from '@/components/atoms';
import { PressableCard } from '../molecules';

type VerseOfTheDayCardProps = {
  title: string;
  verseText: string;
  reference: string;
  actionLabel: string;
  onPress: () => void;
};

export function VerseOfTheDayCard({ title, verseText, reference, actionLabel, onPress }: VerseOfTheDayCardProps) {
  return (
    <PressableCard onPress={onPress}>
      <PressableCard.Header>
        <Text variant={TEXT_VARIANTS.Overline} color="textSecondary" style={styles.uppercase}>
          {title}
        </Text>
      </PressableCard.Header>
      <PressableCard.Body>
        <Text variant={TEXT_VARIANTS.BodyEmphasis}>{verseText}</Text>
      </PressableCard.Body>
      <PressableCard.Footer style={styles.footer}>
        <Text variant={TEXT_VARIANTS.Callout} color="textSecondary">
          {reference}
        </Text>
        <View style={styles.action}>
          <Text variant={TEXT_VARIANTS.Label} color="accent">
            {actionLabel}
          </Text>
          <ChevronRight size={16} color={styles.accentColor.color} strokeWidth={2} />
        </View>
      </PressableCard.Footer>
    </PressableCard>
  );
}

const styles = StyleSheet.create((theme) => ({
  uppercase: {
    textTransform: 'uppercase',
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
