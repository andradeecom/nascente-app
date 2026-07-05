import { View } from 'react-native';
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { PressableCard } from '@/components/molecules';
import { useThemeStore } from '@/stores/theme';

type SignInPromptCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  onPress: () => void;
};

/**
 * Tappable card prompting a guest to sign in / create an account to unlock a
 * gated feature. The whole card is the CTA (no separate button) — see the Plans
 * tab for usage. Reusable for other account-gated surfaces.
 */
export function SignInPromptCard({ icon: Icon, title, description, actionLabel, onPress }: SignInPromptCardProps) {
  // Icon is a caller-supplied component, so it can't be wrapped with withUnistyles at
  // module scope. Read theme name reactively and pass the color as a plain prop instead.
  const themeName = useThemeStore((s) => s.theme);
  const theme = UnistylesRuntime.getTheme(themeName);

  return (
    <PressableCard style={styles.card} onPress={onPress} accessibilityRole="button">
      <View style={styles.iconBadge}>
        <Icon size={26} color={theme.colors.semantic.accent} strokeWidth={2} />
      </View>
      <Text variant={TEXT_VARIANTS.Title3} style={styles.title}>
        {title}
      </Text>
      <Text variant={TEXT_VARIANTS.Callout} color={TEXT_COLORS.TextSecondary} style={styles.description}>
        {description}
      </Text>
      <View style={styles.action}>
        <Text variant={TEXT_VARIANTS.Label} color={TEXT_COLORS.Accent}>
          {actionLabel}
        </Text>
        <ChevronRight size={18} color={theme.colors.semantic.accent} strokeWidth={2.5} />
      </View>
    </PressableCard>
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
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
    marginTop: theme.spacing[3],
  },
}));
