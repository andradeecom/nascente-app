import { View } from 'react-native';
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles';
import { type LucideIcon } from 'lucide-react-native';
import { Button, TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { BUTTON_VARIANTS } from '@/components/atoms/Button';
import { Card } from '@/components/molecules';
import { useThemeStore } from '@/stores/theme';

type StudyEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel: string;
  onPress: () => void;
};

/**
 * Empty-state card for a Study-tab filter with no items yet (highlights / notes /
 * bookmarks). Same icon-badge + title + description + CTA shape as `ProLockCard`,
 * but a static `Card` with an outlined (Secondary) CTA — the wall here isn't a
 * gate, it's a "nothing here yet, go make one" nudge back to the reader.
 */
export function StudyEmptyState({ icon: Icon, title, description, ctaLabel, onPress }: StudyEmptyStateProps) {
  // Icon is a caller-supplied component, so it can't be wrapped with withUnistyles
  // at module scope. Read the theme name reactively and pass the color as a plain
  // prop instead (same pattern as ProLockCard).
  const themeName = useThemeStore((s) => s.theme);
  const theme = UnistylesRuntime.getTheme(themeName);

  return (
    <Card style={styles.card}>
      <View style={styles.iconBadge}>
        <Icon size={26} color={theme.colors.semantic.accent} strokeWidth={2} />
      </View>
      <Text variant={TEXT_VARIANTS.Title3} style={styles.text}>
        {title}
      </Text>
      <Text variant={TEXT_VARIANTS.Callout} color={TEXT_COLORS.TextSecondary} style={styles.text}>
        {description}
      </Text>
      <Button variant={BUTTON_VARIANTS.Secondary} label={ctaLabel} onPress={onPress} style={styles.cta} />
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    alignItems: 'center',
    padding: theme.spacing[6],
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.semantic.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[2],
  },
  text: {
    textAlign: 'center',
  },
  cta: {
    marginTop: theme.spacing[4],
  },
}));
