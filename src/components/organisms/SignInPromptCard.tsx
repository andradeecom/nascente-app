import { View } from 'react-native';
import { PressableScale } from 'pressto';
import { StyleSheet } from 'react-native-unistyles';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { Text, TextVariants } from '@/components/atoms';

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
  return (
    <PressableScale style={styles.card} onPress={onPress} accessibilityRole="button">
      <View style={styles.iconBadge}>
        <Icon size={26} color={styles.iconColor.color} strokeWidth={2} />
      </View>
      <Text variant={TextVariants.Title3} style={styles.title}>
        {title}
      </Text>
      <Text variant={TextVariants.Callout} color="textSecondary" style={styles.description}>
        {description}
      </Text>
      <View style={styles.action}>
        <Text variant={TextVariants.Label} color="accent">
          {actionLabel}
        </Text>
        <ChevronRight size={18} color={styles.iconColor.color} strokeWidth={2.5} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    alignItems: 'center',
    backgroundColor: theme.colors.semantic.bgPrimary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing[6],
    gap: theme.spacing[2],
    ...theme.shadows.lg,
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
  iconColor: {
    color: theme.colors.semantic.accent,
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
