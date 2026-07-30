import { Link } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';
import { SafeAreaView, TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { KeyboardAwareScreen, OnboardingStepHeader } from '@/components/molecules';
import { RegisterCard } from '@/components/organisms';
import { useTranslate } from '@/i18n';
import useOnboardingRegisterScreen from './use-onboarding-register-screen';

export default function OnboardingRegisterScreen() {
  const t = useTranslate();
  const {
    handleRegister,
    handleGoogleRegister,
    handleAppleRegister,
    handleBack,
    isLoading,
    needsConfirmation,
    submittedEmail,
  } = useOnboardingRegisterScreen();

  return (
    <SafeAreaView style={styles.safe}>
      <OnboardingStepHeader step={4} total={4} onBack={handleBack} />
      <KeyboardAwareScreen contentContainerStyle={styles.scroll}>
        <RegisterCard
          onRegister={handleRegister}
          onRegisterWithGoogle={handleGoogleRegister}
          onRegisterWithApple={handleAppleRegister}
          isLoading={isLoading}
          needsConfirmation={needsConfirmation}
          submittedEmail={submittedEmail ?? undefined}
        />
        <Link href="/onboarding/account/login" style={styles.footerLink}>
          <Text variant={TEXT_VARIANTS.Callout} color={TEXT_COLORS.TextSecondary}>
            {t('register.alreadyHaveAccount')} {t('register.signIn')}
          </Text>
        </Link>
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
}));
