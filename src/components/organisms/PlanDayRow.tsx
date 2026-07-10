import { View } from 'react-native';
import { PressableScale } from 'pressto';
import { StyleSheet, UnistylesRuntime, withUnistyles } from 'react-native-unistyles';
import { Check, ChevronRight } from 'lucide-react-native';
import { TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { useTranslate } from '@/i18n';
import { hapticConfirm } from '@/lib/haptics';
import { useThemeStore } from '@/stores/theme';
import type { PlanDayGroup } from '@/types/reading-plans';

const ThemedChevronRight = withUnistyles(ChevronRight, (theme) => ({ color: theme.colors.semantic.textTertiary }));

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
  // Not wrapped with withUnistyles: PressableScale (pressto) is Reanimated-based,
  // and forcing it to re-render on every theme tick would trip Reanimated's strict-mode
  // "reading value during render" warning. Read theme name reactively and derive plain styles instead.
  const themeName = useThemeStore((s) => s.theme);
  const theme = UnistylesRuntime.getTheme(themeName);
  const dayRowStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.spacing[3],
    backgroundColor: theme.colors.semantic.bgSecondary,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
  };
  const checkStyle = {
    width: 28,
    height: 28,
    borderRadius: theme.radius.full,
    borderWidth: 2,
    borderColor: item.completed ? theme.colors.semantic.accent : theme.colors.semantic.bgTertiary,
    backgroundColor: item.completed ? theme.colors.semantic.accent : undefined,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
  const checkDoneIconColor = theme.colors.semantic.bgPrimary;

  return (
    <PressableScale style={dayRowStyle} onPress={() => onOpenReading(item)}>
      {isEnrolled ? (
        <PressableScale
          onPress={() => {
            hapticConfirm();
            onToggleComplete(item);
          }}
          disabled={item.completed || markingDay === item.day}
          hitSlop={8}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: item.completed }}
          style={checkStyle}
        >
          {item.completed ? <Check size={16} color={checkDoneIconColor} strokeWidth={3} /> : null}
        </PressableScale>
      ) : (
        <View style={styles.dayBadge}>
          <Text variant={TEXT_VARIANTS.Caption} color={TEXT_COLORS.Accent} style={styles.dayBadgeText}>
            {item.day}
          </Text>
        </View>
      )}

      <View style={styles.dayBody}>
        <Text variant={TEXT_VARIANTS.Caption} color={TEXT_COLORS.TextTertiary}>
          {translate('plans.day', { count: item.day })}
        </Text>
        <Text variant={TEXT_VARIANTS.Body} numberOfLines={1}>
          {item.label}
        </Text>
      </View>

      <ThemedChevronRight size={18} />
    </PressableScale>
  );
}

const styles = StyleSheet.create((theme) => ({
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
}));
