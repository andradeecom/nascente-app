import { ActivityIndicator, View } from 'react-native';
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles';
import { CheckCircle2 } from 'lucide-react-native';
import { Button, SafeAreaView, TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { BUTTON_SIZES, BUTTON_VARIANTS } from '@/components/atoms/Button';
import { AuthLinkErrorView } from '@/components/organisms';
import { useThemeStore } from '@/stores/theme';
import { useTranslate } from '@/i18n';
import useConfirmEmailScreen from './use-confirm-email-screen';

export default function ConfirmEmailScreen() {
  const t = useTranslate();
  const { status, handleContinue, handleGoToLogin } = useConfirmEmailScreen();
  const themeName = useThemeStore((s) => s.theme);
  const theme = UnistylesRuntime.getTheme(themeName);

  if (status === 'resolving') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={theme.colors.semantic.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'error') {
    return (
      <AuthLinkErrorView
        title={t('confirmEmail.errorTitle')}
        description={t('confirmEmail.errorDescription')}
        actionLabel={t('confirmEmail.errorAction')}
        onAction={handleGoToLogin}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.iconBadge}>
          <CheckCircle2 size={32} color={theme.colors.semantic.accent} strokeWidth={2} />
        </View>
        <Text variant={TEXT_VARIANTS.Title2} style={styles.text}>
          {t('confirmEmail.successTitle')}
        </Text>
        <Text variant={TEXT_VARIANTS.Callout} color={TEXT_COLORS.TextSecondary} style={styles.text}>
          {t('confirmEmail.successDescription')}
        </Text>
        <Button
          label={t('confirmEmail.successAction')}
          variant={BUTTON_VARIANTS.Primary}
          size={BUTTON_SIZES.Large}
          onPress={handleContinue}
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
