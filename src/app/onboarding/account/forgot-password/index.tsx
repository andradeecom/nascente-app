import { Link, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';
import { SafeAreaView, TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { KeyboardAwareScreen, OnboardingStepHeader } from '@/components/molecules';
import { ForgotPasswordCard } from '@/components/organisms';
import { useTranslate } from '@/i18n';
import useOnboardingForgotPasswordScreen from './use-onboarding-forgot-password-screen';

export default function OnboardingForgotPasswordScreen() {
  const t = useTranslate();
  const { handleSubmit, isLoading, isSubmitted, submittedEmail } = useOnboardingForgotPasswordScreen();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <OnboardingStepHeader step={4} total={4} onBack={() => router.back()} />
      <KeyboardAwareScreen contentContainerStyle={styles.scroll}>
        <ForgotPasswordCard
          onSubmit={handleSubmit}
          isLoading={isLoading}
          isSubmitted={isSubmitted}
          submittedEmail={submittedEmail ?? undefined}
        />
        <Link href="/onboarding/account/login" style={styles.footerLink}>
          <Text variant={TEXT_VARIANTS.Callout} color={TEXT_COLORS.TextSecondary}>
            {t('forgotPassword.backToLogin')}
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
