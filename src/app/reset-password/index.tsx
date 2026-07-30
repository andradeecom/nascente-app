import { ActivityIndicator, View } from 'react-native';
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles';
import { AuthLinkErrorView, ResetPasswordCard } from '@/components/organisms';
import { SafeAreaView } from '@/components/atoms';
import { KeyboardAwareScreen } from '@/components/molecules';
import { useThemeStore } from '@/stores/theme';
import { useTranslate } from '@/i18n';
import useResetPasswordScreen from './use-reset-password-screen';

export default function ResetPasswordScreen() {
  const t = useTranslate();
  const { linkStatus, handleSubmit, handleGoToForgotPassword, isLoading } = useResetPasswordScreen();
  const themeName = useThemeStore((s) => s.theme);
  const theme = UnistylesRuntime.getTheme(themeName);

  if (linkStatus === 'resolving') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.colors.semantic.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (linkStatus === 'error') {
    return (
      <AuthLinkErrorView
        title={t('resetPassword.linkErrorTitle')}
        description={t('resetPassword.linkErrorDescription')}
        actionLabel={t('resetPassword.linkErrorAction')}
        onAction={handleGoToForgotPassword}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAwareScreen contentContainerStyle={styles.scroll}>
        <ResetPasswordCard onSubmit={handleSubmit} isLoading={isLoading} />
      </KeyboardAwareScreen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.semantic.bgPrimary,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[6],
  },
}));
