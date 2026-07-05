import { View } from 'react-native';
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles';
import { Check, Cloud, Lock } from 'lucide-react-native';
import { PressableScale } from 'pressto';
import { TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { useThemeStore } from '@/stores/theme';

export enum TRANSLATION_TIER {
  Available = 'available',
  Pro = 'pro',
}

export type TranslationTier = (typeof TRANSLATION_TIER)[keyof typeof TRANSLATION_TIER];

type TranslationOptionProps = {
  title: string;
  description: string;
  size: string;
  tier: TranslationTier;
  offlineLabel: string;
  proLabel: string;
  selected: boolean;
  onSelect: () => void;
};

export function TranslationOption({
  title,
  description,
  size,
  tier,
  offlineLabel,
  proLabel,
  selected,
  onSelect,
}: TranslationOptionProps) {
  const selectable = tier === TRANSLATION_TIER.Available;

  // Not wrapped with withUnistyles: PressableScale (pressto) is Reanimated-based,
  // and forcing it to re-render on every theme tick would trip Reanimated's strict-mode
  // "reading value during render" warning. Read theme name reactively and derive plain styles instead.
  const themeName = useThemeStore((s) => s.theme);
  const theme = UnistylesRuntime.getTheme(themeName);
  const containerStyle = {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    padding: theme.spacing[4],
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: selected ? theme.colors.semantic.accent : theme.colors.semantic.bgTertiary,
    backgroundColor: selected ? theme.colors.semantic.accentSubtle : theme.colors.semantic.bgPrimary,
    gap: theme.spacing[3],
    opacity: selectable ? 1 : 0.5,
  };

  return (
    <PressableScale
      style={containerStyle}
      onPress={selectable ? onSelect : undefined}
      disabled={!selectable}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled: !selectable }}
    >
      <View
        style={[
          styles.radio,
          {
            borderColor: selected ? theme.colors.semantic.accent : theme.colors.semantic.textTertiary,
            backgroundColor: selected ? theme.colors.semantic.accent : undefined,
          },
        ]}
      >
        {selected && <Check size={14} color={theme.colors.semantic.bgPrimary} strokeWidth={3} />}
      </View>

      <View style={styles.text}>
        <Text variant={TEXT_VARIANTS.BodyEmphasis}>{title}</Text>
        <Text variant={TEXT_VARIANTS.Caption} color={TEXT_COLORS.TextSecondary} style={styles.description}>
          {description}
        </Text>
        <Text variant={TEXT_VARIANTS.Caption} color={TEXT_COLORS.TextTertiary} style={styles.size}>
          {size}
        </Text>
      </View>

      <View style={styles.badge}>
        {tier === TRANSLATION_TIER.Available && (
          <View style={styles.offlineBadge}>
            <Cloud size={14} color={theme.colors.semantic.accent} />
            <Text variant={TEXT_VARIANTS.Caption} color={TEXT_COLORS.Accent}>
              {offlineLabel}
            </Text>
          </View>
        )}
        {tier === TRANSLATION_TIER.Pro && (
          <View style={[styles.proBadge, { borderColor: theme.colors.semantic.accent }]}>
            <Lock size={12} color={theme.colors.semantic.accent} />
            <Text variant={TEXT_VARIANTS.Caption} color={TEXT_COLORS.Accent}>
              {proLabel}
            </Text>
          </View>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create((theme) => ({
  radio: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing[0.5],
  },
  text: {
    flex: 1,
  },
  description: {
    marginTop: theme.spacing[1],
  },
  size: {
    marginTop: theme.spacing[1],
  },
  badge: {
    alignItems: 'flex-end',
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
}));
