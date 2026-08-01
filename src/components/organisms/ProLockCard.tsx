import { View } from 'react-native';
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles';
import { Sparkles, type LucideIcon } from 'lucide-react-native';
import { Button, TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { PressableCard } from '@/components/molecules';
import { useThemeStore } from '@/stores/theme';
import { BUTTON_VARIANTS } from '../atoms/Button';

type ProLockCardProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  ctaLabel: string;
  /**
   * Small caption under the CTA disclosing a precondition — pass the
   * "requires an account" line for guests (see `useProGate().requiresAccount`).
   */
  hint?: string;
  onPress: () => void;
};

/**
 * Full-card Pro gate for a whole surface that's now Pro-only (Study tab, Plans
 * tab). Mirrors `SignInPromptCard`'s shape but with a `pro`-variant CTA that
 * routes to the paywall — used where the wall is Pro (a free account doesn't
 * unlock the feature), so we upsell directly rather than prompt sign-in. For a
 * centered dialog use `UpsellModal`.
 *
 * Drive `onPress` from `useProGate().openPro` rather than pushing `/paywall`
 * directly — an account is a precondition for buying Pro, so guests are routed
 * to `/register` instead. Pass `hint` (gated on `requiresAccount`) so that
 * precondition is disclosed before the tap, not discovered after it.
 */
export function ProLockCard({ icon: Icon = Sparkles, title, description, ctaLabel, hint, onPress }: ProLockCardProps) {
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
      <Button variant={BUTTON_VARIANTS.Pro} label={ctaLabel} onPress={onPress} fullWidth style={styles.cta} />
      {hint ? (
        <Text variant={TEXT_VARIANTS.Caption} color={TEXT_COLORS.TextTertiary} style={styles.hint}>
          {hint}
        </Text>
      ) : null}
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
  cta: {
    marginTop: theme.spacing[4],
    alignSelf: 'stretch',
  },
  hint: {
    marginTop: theme.spacing[2],
    textAlign: 'center',
  },
}));
