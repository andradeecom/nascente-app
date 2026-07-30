import { RegisterCard } from '@/components/organisms';
import { translate } from '@/i18n';
import { Link } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';
import { SafeAreaView, TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { BackButton, KeyboardAwareScreen } from '@/components/molecules';
import useRegisterScreen from './use-register-screen';

export default function RegisterScreen() {
  const { handleRegister, handleGoogleRegister, handleAppleRegister, isLoading, needsConfirmation, submittedEmail } =
    useRegisterScreen();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <BackButton />
      <KeyboardAwareScreen contentContainerStyle={styles.scroll}>
        <RegisterCard
          onRegister={handleRegister}
          onRegisterWithGoogle={handleGoogleRegister}
          onRegisterWithApple={handleAppleRegister}
          isLoading={isLoading}
          needsConfirmation={needsConfirmation}
          submittedEmail={submittedEmail ?? undefined}
        />
        <Link href="/login" style={styles.footerLink}>
          <Text variant={TEXT_VARIANTS.Callout} color={TEXT_COLORS.TextSecondary}>
            {translate('register.alreadyHaveAccount')} {translate('register.signIn')}
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
    paddingVertical: theme.spacing[3],
  },
  footerLink: {
    alignSelf: 'center',
    marginTop: theme.spacing[4],
  },
}));
