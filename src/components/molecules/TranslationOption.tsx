import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Check, Cloud, Download, Lock } from 'lucide-react-native';
import { PressableScale } from 'pressto';
import { Text, TEXT_VARIANTS } from '@/components/atoms';

export enum TRANSLATION_TIER {
  Available = 'available',
  Download = 'download',
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

  return (
    <PressableScale
      style={[styles.container, selected && styles.selected, !selectable && styles.disabled]}
      onPress={selectable ? onSelect : undefined}
      disabled={!selectable}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled: !selectable }}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <Check size={14} color={styles.checkIcon.color} strokeWidth={3} />}
      </View>

      <View style={styles.text}>
        <Text variant={TEXT_VARIANTS.BodyEmphasis}>{title}</Text>
        <Text variant={TEXT_VARIANTS.Caption} color="textSecondary" style={styles.description}>
          {description}
        </Text>
        <Text variant={TEXT_VARIANTS.Caption} color="textTertiary" style={styles.size}>
          {size}
        </Text>
      </View>

      <View style={styles.badge}>
        {tier === TRANSLATION_TIER.Available && (
          <View style={styles.offlineBadge}>
            <Cloud size={14} color={styles.offlineBadge.color} />
            <Text variant={TEXT_VARIANTS.Caption} color="accent">
              {offlineLabel}
            </Text>
          </View>
        )}
        {tier === TRANSLATION_TIER.Download && <Download size={18} color={styles.downloadIcon.color} />}
        {tier === TRANSLATION_TIER.Pro && (
          <View style={styles.proBadge}>
            <Lock size={12} color={styles.proBadge.color} />
            <Text variant={TEXT_VARIANTS.Caption} color="accent">
              {proLabel}
            </Text>
          </View>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  disabled: {
    opacity: 0.5,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.full,
    borderWidth: 1.5,
    borderColor: theme.colors.semantic.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing[0.5],
  },
  radioSelected: {
    borderColor: theme.colors.semantic.accent,
    backgroundColor: theme.colors.semantic.accent,
  },
  checkIcon: {
    color: theme.colors.semantic.bgPrimary,
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
    color: theme.colors.semantic.accent,
  },
  downloadIcon: {
    color: theme.colors.semantic.textSecondary,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.semantic.accent,
    borderStyle: 'dashed',
    color: theme.colors.semantic.accent,
  },
}));
