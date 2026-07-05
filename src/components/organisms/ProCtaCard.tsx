import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { PressableCard } from '../molecules';

type ProCtaCardProps = {
  title: string;
  description: string;
  /** Badge text, e.g. "PRO". */
  badgeLabel: string;
  onPress: () => void;
};

/**
 * Pro-upsell nudge card on the Home tab — shown only to signed-in non-Pro users
 * (gated upstream via `showProCta`). The whole card is the CTA, opening the paywall.
 */
export function ProCtaCard({ title, description, badgeLabel, onPress }: ProCtaCardProps) {
  return (
    <PressableCard style={styles.proCard} onPress={onPress} accessibilityRole="button">
      <View style={styles.proBadge}>
        <Text variant={TEXT_VARIANTS.Caption} style={styles.proBadgeText}>
          {badgeLabel}
        </Text>
      </View>
      <Text variant={TEXT_VARIANTS.BodyEmphasis}>{title}</Text>
      <Text variant={TEXT_VARIANTS.Callout} color={TEXT_COLORS.TextSecondary}>
        {description}
      </Text>
    </PressableCard>
  );
}

const styles = StyleSheet.create((theme) => ({
  proCard: {
    backgroundColor: theme.colors.semantic.accentSubtle,
  },
  proBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.semantic.accent,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[0.5],
  },
  proBadgeText: {
    color: '#FFFFFF',
    fontWeight: theme.font.weights.bold,
    marginBottom: theme.spacing[0.5],
  },
}));
