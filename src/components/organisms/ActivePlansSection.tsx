import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, TEXT_VARIANTS } from '@/components/atoms';
import { ActivePlanCard } from '@/components/organisms/ActivePlanCard';
import type { ActiveReadingPlan } from '@/types/reading-plans';

type ActivePlansSectionProps = {
  title: string;
  exploreLabel: string;
  emptyLabel: string;
  nextLabel: string;
  plans: ActiveReadingPlan[];
  onExplore: () => void;
  onPlanPress?: (planId: string) => void;
};

export function ActivePlansSection({
  title,
  exploreLabel,
  emptyLabel,
  nextLabel,
  plans,
  onExplore,
  onPlanPress,
}: ActivePlansSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text variant={TEXT_VARIANTS.Overline} color="textSecondary" style={styles.uppercase}>
          {title}
        </Text>
        <Pressable onPress={onExplore}>
          <Text variant={TEXT_VARIANTS.Label} color="accent">
            {exploreLabel}
          </Text>
        </Pressable>
      </View>

      {plans.length > 0 ? (
        plans
          .slice(0, 2)
          .map((plan) => (
            <ActivePlanCard
              key={plan.userPlan.id}
              plan={plan}
              nextLabel={nextLabel}
              onPress={onPlanPress ? () => onPlanPress(plan.plan.id) : undefined}
            />
          ))
      ) : (
        <View style={styles.empty}>
          <Text variant={TEXT_VARIANTS.Callout} color="textSecondary">
            {emptyLabel}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  section: {
    gap: theme.spacing[3],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  uppercase: {
    textTransform: 'uppercase',
  },
  empty: {
    backgroundColor: theme.colors.semantic.bgSecondary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing[5],
    alignItems: 'center',
  },
}));
