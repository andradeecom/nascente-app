import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { CalendarDays } from 'lucide-react-native';
import { Button, Text, TEXT_VARIANTS } from '@/components/atoms';
import { PressableCard } from '@/components/molecules';
import type { SuggestedReadingPlan } from '@/types/reading-plans';
import { BUTTON_SIZES, BUTTON_VARIANTS } from '../atoms/Button';

type SuggestedPlanCardProps = {
  plan: SuggestedReadingPlan;
  /** Localized cadence + duration meta, e.g. "30 dias · diário". */
  meta: string;
  /** "Começar" button label. */
  startLabel: string;
  onStart?: () => void;
  /** Tapping the card body (not the button) opens the plan detail/preview. */
  onPress?: () => void;
  loading?: boolean;
};

export function SuggestedPlanCard({ plan, meta, startLabel, onStart, onPress, loading }: SuggestedPlanCardProps) {
  return (
    <PressableCard onPress={onPress} style={styles.card}>
      <View style={styles.icon}>
        <CalendarDays size={22} color={styles.icon.color} />
      </View>
      <View style={styles.body}>
        <Text variant={TEXT_VARIANTS.BodyEmphasis} numberOfLines={2}>
          {plan.title}
        </Text>
        <Text variant={TEXT_VARIANTS.Callout} color="textSecondary" numberOfLines={1}>
          {meta}
        </Text>
      </View>
      <Button
        variant={BUTTON_VARIANTS.Secondary}
        size={BUTTON_SIZES.Small}
        label={startLabel}
        onPress={onStart}
        disabled={loading}
      />
    </PressableCard>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing[4],
    gap: theme.spacing[3],
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
