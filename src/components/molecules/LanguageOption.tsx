import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, TEXT_VARIANTS } from '@/components/atoms';
import type { LocaleName } from '@/stores/locale';
import { PressableScale } from 'pressto';

type LanguageOptionProps = {
  code: LocaleName;
  name: string;
  region: string;
  selected: boolean;
  onSelect: () => void;
};

export function LanguageOption({ code, name, region, selected, onSelect }: LanguageOptionProps) {
  return (
    <PressableScale
      style={[styles.container, selected && styles.selected]}
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <Text style={styles.badge}>{code.toUpperCase()}</Text>
      <View style={styles.text}>
        <Text variant={TEXT_VARIANTS.BodyEmphasis}>{name}</Text>
        <Text variant={TEXT_VARIANTS.Caption} color="textSecondary">
          {region}
        </Text>
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>
    </PressableScale>
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
  badge: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.semantic.accentSubtle,
    color: theme.colors.semantic.accent,
    textAlign: 'center',
    lineHeight: 40,
    fontWeight: theme.font.weights.semibold,
    fontSize: theme.font.sizes.label,
  },
  text: {
    flex: 1,
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
}));
