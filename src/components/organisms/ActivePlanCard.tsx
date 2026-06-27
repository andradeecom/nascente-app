import { View, type ViewStyle } from 'react-native';
import { PressableScale } from 'pressto';
import { StyleSheet } from 'react-native-unistyles';
import { Text, TextVariants } from '@/components/atoms';
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
    <PressableScale onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text variant={TextVariants.Caption} color="accent" style={styles.badgeText}>
            {progressPercent}%
          </Text>
        </View>
        <View style={styles.body}>
          <Text variant={TextVariants.BodyEmphasis} numberOfLines={1}>
            {catalog.title}
          </Text>
          {subtitle ? (
            <Text variant={TextVariants.Callout} color="textSecondary" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progressPercent}%` } as ViewStyle]} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.semantic.bgPrimary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing[4],
    gap: theme.spacing[3],
    ...theme.shadows.lg,
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
