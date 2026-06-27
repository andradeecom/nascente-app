import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';
import { Text, TEXT_VARIANTS, SafeAreaView } from '@/components/atoms';
import { OnboardingStepHeader } from '@/components/molecules';
import { RegisterCard } from '@/components/organisms';
import { translate } from '@/i18n';
import useOnboardingRegisterScreen from './use-onboarding-register-screen';

export default function OnboardingRegisterScreen() {
  const { handleRegister, handleGoogleRegister, handleAppleRegister, handleBack, isLoading } =
    useOnboardingRegisterScreen();

  return (
    <SafeAreaView style={styles.safe}>
      <OnboardingStepHeader step={4} total={4} onBack={handleBack} />
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <RegisterCard
            onRegister={handleRegister}
            onRegisterWithGoogle={handleGoogleRegister}
            onRegisterWithApple={handleAppleRegister}
            isLoading={isLoading}
          />
          <Link href="/onboarding/account/login" style={styles.footerLink}>
            <Text variant={TEXT_VARIANTS.Callout} color="textSecondary">
              {translate('register.alreadyHaveAccount')} {translate('register.signIn')}
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
