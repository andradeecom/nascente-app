import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';
import { Button, Text, TEXT_VARIANTS, SafeAreaView } from '@/components/atoms';
import { OnboardingStepHeader } from '@/components/molecules';
import { LoginCard } from '@/components/organisms';
import { translate } from '@/i18n';
import useOnboardingLoginScreen from './use-onboarding-login-screen';
import { BUTTON_SIZES, BUTTON_VARIANTS } from '@/components/atoms/Button';

export default function OnboardingLoginScreen() {
  const { handleLogin, handleGoogleLogin, handleAppleLogin, handleForgotPassword, handleBack, mockLogin, isLoading } =
    useOnboardingLoginScreen();

  return (
    <SafeAreaView style={styles.safe}>
      <OnboardingStepHeader step={4} total={4} onBack={handleBack} />
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <LoginCard
            onLogin={handleLogin}
            onLoginWithGoogle={handleGoogleLogin}
            onLoginWithApple={handleAppleLogin}
            onForgotPassword={handleForgotPassword}
            isLoading={isLoading}
          />
          <Link href="/onboarding/account/register" style={styles.footerLink}>
            <Text variant={TEXT_VARIANTS.Callout} color="textSecondary">
              {translate('login.noAccount')} {translate('login.signUp')}
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
  devButton: {
    marginTop: theme.spacing[4],
  },
}));
