import { View, type ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { PressableCard } from '@/components/molecules';
import type { ActiveReadingPlan } from '@/types/reading-plans';

type ActivePlanCardProps = {
  plan: ActiveReadingPlan;
  /** Label prefix for the next reading, e.g. "Próxima". */
  nextLabel: string;
  onPress?: () => void;
};

export function ActivePlanCard({ plan, nextLabel, onPress }: ActivePlanCardProps) {
  const { plan: catalog, progressPercent, nextReadingLabel } = plan;
  const subtitle = nextReadingLabel ? `${nextLabel}: ${nextReadingLabel}` : catalog.description;

  return (
    <PressableCard onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text variant={TEXT_VARIANTS.Caption} color={TEXT_COLORS.Accent} style={styles.badgeText}>
            {progressPercent}%
          </Text>
        </View>
        <View style={styles.body}>
          <Text variant={TEXT_VARIANTS.BodyEmphasis} numberOfLines={1}>
            {catalog.title}
          </Text>
          {subtitle ? (
            <Text variant={TEXT_VARIANTS.Callout} color={TEXT_COLORS.TextSecondary} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progressPercent}%` } as ViewStyle]} />
      </View>
    </PressableCard>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    gap: theme.spacing[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.semantic.accentSubtle,
  },
  badgeText: {
    fontWeight: theme.font.weights.semibold,
  },
  body: {
    flex: 1,
    gap: theme.spacing[0.5],
  },
  track: {
    height: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.semantic.bgTertiary,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.semantic.accent,
  },
}));
