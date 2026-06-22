import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { CalendarDays } from 'lucide-react-native';
import { Button, Text, TextVariants } from '@/components/atoms';
import type { SuggestedReadingPlan } from '@/types/reading-plans';

type SuggestedPlanCardProps = {
  plan: SuggestedReadingPlan;
  /** Localized cadence + duration meta, e.g. "30 dias · diário". */
  meta: string;
  /** "Começar" button label. */
  startLabel: string;
  onStart?: () => void;
  loading?: boolean;
};

export function SuggestedPlanCard({ plan, meta, startLabel, onStart, loading }: SuggestedPlanCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.icon}>
        <CalendarDays size={22} color={styles.icon.color} />
      </View>
      <View style={styles.body}>
        <Text variant={TextVariants.BodyEmphasis} numberOfLines={2}>
          {plan.title}
        </Text>
        <Text variant={TextVariants.Callout} color="textSecondary" numberOfLines={1}>
          {meta}
        </Text>
      </View>
      <Button variant="secondary" size="sm" label={startLabel} onPress={onStart} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
    backgroundColor: theme.colors.semantic.bgPrimary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing[4],
    ...theme.shadows.lg,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.semantic.accentSubtle,
    color: theme.colors.semantic.accent,
  },
  body: {
    flex: 1,
    gap: theme.spacing[0.5],
  },
}));
