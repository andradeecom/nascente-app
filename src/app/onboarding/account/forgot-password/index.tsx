import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';
import { Text, TEXT_VARIANTS, SafeAreaView } from '@/components/atoms';
import { OnboardingStepHeader } from '@/components/molecules';
import { ForgotPasswordCard } from '@/components/organisms';
import { translate } from '@/i18n';
import useOnboardingForgotPasswordScreen from './use-onboarding-forgot-password-screen';

export default function OnboardingForgotPasswordScreen() {
  const { handleSubmit, isLoading, isSubmitted, submittedEmail } = useOnboardingForgotPasswordScreen();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <OnboardingStepHeader step={4} total={4} onBack={() => router.back()} />
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <ForgotPasswordCard
            onSubmit={handleSubmit}
            isLoading={isLoading}
            isSubmitted={isSubmitted}
            submittedEmail={submittedEmail ?? undefined}
          />
          <Link href="/onboarding/account/login" style={styles.footerLink}>
            <Text variant={TEXT_VARIANTS.Callout} color="textSecondary">
              {translate('forgotPassword.backToLogin')}
            </Text>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.semantic.bgPrimary,
  },
  keyboard: {
    flex: 1,
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
