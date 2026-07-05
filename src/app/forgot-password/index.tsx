import { ForgotPasswordCard } from '@/components/organisms';
import { translate } from '@/i18n';
import { Link } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';
import { SafeAreaView, TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { BackButton, KeyboardAwareScreen } from '@/components/molecules';
import useForgotPasswordScreen from './use-forgot-password-screen';

export default function ForgotPasswordScreen() {
  const { handleSubmit, isLoading, isSubmitted, submittedEmail } = useForgotPasswordScreen();

  return (
    <SafeAreaView style={styles.safe}>
      <BackButton />
      <KeyboardAwareScreen contentContainerStyle={styles.scroll}>
        <ForgotPasswordCard
          onSubmit={handleSubmit}
          isLoading={isLoading}
          isSubmitted={isSubmitted}
          submittedEmail={submittedEmail ?? undefined}
        />
        <Link href="/login" style={styles.footerLink}>
          <Text variant={TEXT_VARIANTS.Callout} color={TEXT_COLORS.TextSecondary}>
            {translate('forgotPassword.backToLogin')}
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
