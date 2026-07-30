import { View } from 'react-native';
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles';
import { MailWarning } from 'lucide-react-native';
import { Button, SafeAreaView, TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { BUTTON_SIZES, BUTTON_VARIANTS } from '@/components/atoms/Button';
import { useThemeStore } from '@/stores/theme';

type AuthLinkErrorViewProps = {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
};

/**
 * Shared "this link is expired/invalid" screen for Supabase auth-callback deep
 * links (signup confirmation, password reset) that failed — e.g. `otp_expired`
 * on a stale or already-used link. Callers (confirm-email, reset-password) own
 * the copy + recovery action (resend confirmation vs. request a new reset link).
 */
export function AuthLinkErrorView({ title, description, actionLabel, onAction }: AuthLinkErrorViewProps) {
  const themeName = useThemeStore((s) => s.theme);
  const theme = UnistylesRuntime.getTheme(themeName);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.iconBadge}>
          <MailWarning size={32} color={theme.colors.semantic.accent} strokeWidth={2} />
        </View>
        <Text variant={TEXT_VARIANTS.Title2} style={styles.text}>
          {title}
        </Text>
        <Text variant={TEXT_VARIANTS.Callout} color={TEXT_COLORS.TextSecondary} style={styles.text}>
          {description}
        </Text>
        <Button
          label={actionLabel}
          variant={BUTTON_VARIANTS.Primary}
          size={BUTTON_SIZES.Large}
          onPress={onAction}
          style={styles.cta}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.semantic.bgPrimary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[6],
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.semantic.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[4],
  },
  text: {
    textAlign: 'center',
    marginBottom: theme.spacing[2],
  },
  cta: {
    marginTop: theme.spacing[4],
  },
}));
