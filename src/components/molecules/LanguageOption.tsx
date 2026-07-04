import { View } from 'react-native';
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles';
import { Text, TEXT_VARIANTS } from '@/components/atoms';
import { PressableScale } from 'pressto';
import { useThemeStore } from '@/stores/theme';
import { Locales } from '@/types';

type LanguageOptionProps = {
  code: Locales;
  name: string;
  region: string;
  selected: boolean;
  onSelect: () => void;
};

export function LanguageOption({ code, name, region, selected, onSelect }: LanguageOptionProps) {
  // Not wrapped with withUnistyles: PressableScale (pressto) is Reanimated-based,
  // and forcing it to re-render on every theme tick would trip Reanimated's strict-mode
  // "reading value during render" warning. Read theme name reactively and derive plain styles instead.
  const themeName = useThemeStore((s) => s.theme);
  const theme = UnistylesRuntime.getTheme(themeName);
  const containerStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: theme.spacing[4],
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: selected ? theme.colors.semantic.accent : theme.colors.semantic.bgTertiary,
    backgroundColor: selected ? theme.colors.semantic.accentSubtle : theme.colors.semantic.bgPrimary,
    gap: theme.spacing[3],
  };
  const badgeStyle = {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.semantic.accentSubtle,
    color: theme.colors.semantic.accent,
    textAlign: 'center' as const,
    lineHeight: 40,
    fontWeight: theme.font.weights.semibold,
    fontSize: theme.font.sizes.label,
  };
  const radioStyle = {
    width: 22,
    height: 22,
    borderRadius: theme.radius.full,
    borderWidth: 1.5,
    borderColor: selected ? theme.colors.semantic.accent : theme.colors.semantic.textTertiary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
  const radioInnerStyle = {
    width: 10,
    height: 10,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.semantic.accent,
  };

  return (
    <PressableScale
      style={containerStyle}
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <Text style={badgeStyle}>{code.toUpperCase()}</Text>
      <View style={styles.text}>
        <Text variant={TEXT_VARIANTS.BodyEmphasis}>{name}</Text>
        <Text variant={TEXT_VARIANTS.Caption} color="textSecondary">
          {region}
        </Text>
      </View>
      <View style={radioStyle}>{selected && <View style={radioInnerStyle} />}</View>
    </PressableScale>
  );
}

const styles = StyleSheet.create(() => ({
  text: {
    flex: 1,
  },
}));
