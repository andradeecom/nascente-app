import { View } from 'react-native';
import { PressableScale } from 'pressto';
import { StyleSheet } from 'react-native-unistyles';
import { Check, ChevronRight } from 'lucide-react-native';
import { Text, TextVariants } from '@/components/atoms';
import { useTranslate } from '@/i18n';
import type { PlanDayGroup } from '@/types/reading-plans';

type PlanDayRowProps = {
  item: PlanDayGroup;
  isEnrolled: boolean;
  /** The day currently being marked complete (its checkbox shows as in-flight). */
  markingDay: number | null;
  onToggleComplete: (day: PlanDayGroup) => void;
  onOpenReading: (day: PlanDayGroup) => void;
};

/**
 * A single day in the Plan detail list. The whole row opens the reading; the
 * leading checkbox (enrolled only) is a nested, independent tap target that
 * toggles completion without bubbling up to open the reading.
 */
export function PlanDayRow({ item, isEnrolled, markingDay, onToggleComplete, onOpenReading }: PlanDayRowProps) {
  const translate = useTranslate();

  return (
    <PressableScale style={styles.dayRow} onPress={() => onOpenReading(item)}>
      {isEnrolled ? (
        <PressableScale
          onPress={() => onToggleComplete(item)}
          disabled={item.completed || markingDay === item.day}
          hitSlop={8}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: item.completed }}
          style={[styles.check, item.completed && styles.checkDone]}
        >
          {item.completed ? <Check size={16} color={styles.checkDoneIcon.color} strokeWidth={3} /> : null}
        </PressableScale>
      ) : (
        <View style={styles.dayBadge}>
          <Text variant={TextVariants.Caption} color="accent" style={styles.dayBadgeText}>
            {item.day}
          </Text>
        </View>
      )}

      <View style={styles.dayBody}>
        <Text variant={TextVariants.Caption} color="textTertiary">
          {translate('plans.day', { count: item.day })}
        </Text>
        <Text variant={TextVariants.Body} numberOfLines={1}>
          {item.label}
        </Text>
      </View>

      <ChevronRight size={18} color={styles.chevron.color} />
    </PressableScale>
  );
}

const styles = StyleSheet.create((theme) => ({
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
    backgroundColor: theme.colors.semantic.bgSecondary,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.full,
    borderWidth: 2,
    borderColor: theme.colors.semantic.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: {
    backgroundColor: theme.colors.semantic.accent,
    borderColor: theme.colors.semantic.accent,
  },
  checkDoneIcon: {
    color: theme.colors.semantic.bgPrimary,
  },
  dayBadge: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.semantic.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadgeText: {
    fontWeight: theme.font.weights.semibold,
  },
  dayBody: {
    flex: 1,
    gap: theme.spacing[0.5],
  },
  chevron: {
    color: theme.colors.semantic.textTertiary,
  },
}));
