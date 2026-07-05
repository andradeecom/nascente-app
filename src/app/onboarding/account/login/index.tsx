import { Link } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';
import { Button, SafeAreaView, TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { KeyboardAwareScreen, OnboardingStepHeader } from '@/components/molecules';
import { LoginCard } from '@/components/organisms';
import { useTranslate } from '@/i18n';
import useOnboardingLoginScreen from './use-onboarding-login-screen';
import { BUTTON_SIZES, BUTTON_VARIANTS } from '@/components/atoms/Button';

export default function OnboardingLoginScreen() {
  const t = useTranslate();
  const { handleLogin, handleGoogleLogin, handleAppleLogin, handleForgotPassword, handleBack, mockLogin, isLoading } =
    useOnboardingLoginScreen();

  return (
    <SafeAreaView style={styles.safe}>
      <OnboardingStepHeader step={4} total={4} onBack={handleBack} />
      <KeyboardAwareScreen contentContainerStyle={styles.scroll}>
        <LoginCard
          onLogin={handleLogin}
          onLoginWithGoogle={handleGoogleLogin}
          onLoginWithApple={handleAppleLogin}
          onForgotPassword={handleForgotPassword}
          isLoading={isLoading}
        />
        <Link href="/onboarding/account/register" style={styles.footerLink}>
          <Text variant={TEXT_VARIANTS.Callout} color={TEXT_COLORS.TextSecondary}>
            {t('login.noAccount')} {t('login.signUp')}
          </Text>
        </Link>
        {__DEV__ && (
          <Button
            label="[DEV] Skip login with mock user"
            variant={BUTTON_VARIANTS.Ghost}
            size={BUTTON_SIZES.Small}
            fullWidth
            onPress={mockLogin}
            style={styles.devButton}
          />
        )}
      </KeyboardAwareScreen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.semantic.bgPrimary,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[6],
  },
  footerLink: {
    alignSelf: 'center',
    marginTop: theme.spacing[4],
  },
  devButton: {
    marginTop: theme.spacing[4],
  },
}));
