import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';

type PlanOptionProps = {
  label: string;
  /** Right-aligned headline price, e.g. "US$ 39,99". */
  price: string;
  /** Price period suffix, e.g. "/ano". */
  period: string;
  /** Sub-label under the title, e.g. "≈ US$ 3,33 por mês". */
  caption: string;
  /** Optional savings badge next to the label, e.g. "Economize 33%". */
  badge?: string;
  selected: boolean;
  onSelect: () => void;
};

export function PlanOption({ label, price, period, caption, badge, selected, onSelect }: PlanOptionProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.container, selected && styles.selected, pressed && styles.pressed]}
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>

      <View style={styles.text}>
        <View style={styles.labelRow}>
          <Text variant={TEXT_VARIANTS.BodyEmphasis}>{label}</Text>
          {badge ? (
            <View style={styles.badge}>
              <Text variant={TEXT_VARIANTS.Caption} style={styles.badgeText}>
                {badge}
              </Text>
            </View>
          ) : null}
        </View>
        <Text variant={TEXT_VARIANTS.Caption} color={TEXT_COLORS.TextSecondary}>
          {caption}
        </Text>
      </View>

      <View style={styles.priceCol}>
        <Text variant={TEXT_VARIANTS.Title3}>{price}</Text>
        <Text variant={TEXT_VARIANTS.Caption} color={TEXT_COLORS.TextSecondary}>
          {period}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing[4],
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.semantic.bgTertiary,
    backgroundColor: theme.colors.semantic.bgPrimary,
    gap: theme.spacing[3],
  },
  selected: {
    borderColor: theme.colors.semantic.accent,
    backgroundColor: theme.colors.semantic.accentSubtle,
  },
  pressed: {
    opacity: 0.9,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: theme.radius.full,
    borderWidth: 1.5,
    borderColor: theme.colors.semantic.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: theme.colors.semantic.accent,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.semantic.accent,
  },
  text: {
    flex: 1,
    gap: theme.spacing[0.5],
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  badge: {
    backgroundColor: theme.colors.semantic.warning,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing[1.5],
    paddingVertical: theme.spacing[0.5],
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: theme.font.weights.semibold,
  },
  priceCol: {
    alignItems: 'flex-end',
  },
}));
