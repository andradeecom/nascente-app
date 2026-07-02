import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { PressableScale } from 'pressto';
import { Text, TEXT_VARIANTS } from '@/components/atoms';
import { colors } from '@/theme/colors';
import type { ThemeName } from '@/stores/theme';

type ThemePreviewCardProps = {
  name: ThemeName;
  label: string;
  selected: boolean;
  onSelect: () => void;
};

export function ThemePreviewCard({ name, label, selected, onSelect }: ThemePreviewCardProps) {
  // Each card always shows its own theme's palette, regardless of the active theme.
  const palette = colors[name].semantic;

  // Not wrapped with withUnistyles: PressableScale (pressto) is Reanimated-based,
  // and forcing it to re-render on every theme tick trips Reanimated's strict-mode
  // "reading value during render" warning even while off-screen.
  return (
    <PressableScale
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <View style={[styles.swatch, { backgroundColor: palette.bgPrimary }]}>
        <View style={[styles.line, styles.lineLong, { backgroundColor: palette.textPrimary }]} />
        <View style={[styles.line, styles.lineShort, { backgroundColor: palette.textTertiary }]} />
      </View>
      <Text variant={TEXT_VARIANTS.Caption} style={styles.label}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flex: 1,
    padding: theme.spacing[2],
    borderRadius: theme.radius.xl,
    borderWidth: 1.5,
    borderColor: theme.colors.semantic.bgTertiary,
    backgroundColor: theme.colors.semantic.bgPrimary,
    gap: theme.spacing[2],
  },
  cardSelected: {
    borderColor: theme.colors.semantic.accent,
    backgroundColor: theme.colors.semantic.accentSubtle,
  },
  swatch: {
    height: 64,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.semantic.bgTertiary,
    paddingHorizontal: theme.spacing[3],
    justifyContent: 'center',
    gap: theme.spacing[2],
  },
  line: {
    height: 4,
    borderRadius: theme.radius.full,
  },
  lineLong: {
    width: '70%',
  },
  lineShort: {
    width: '45%',
  },
  label: {
    textAlign: 'center',
    fontWeight: theme.font.weights.semibold,
  },
}));
