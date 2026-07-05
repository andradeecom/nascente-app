import { Button, SafeAreaView, TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { BackButton } from '@/components/molecules';
import { LoginCard, LoginFooter } from '@/components/organisms';
import { translate } from '@/i18n';
import { Link } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import useLoginScreen from './use-login-screen';
import { BUTTON_SIZES, BUTTON_VARIANTS } from '@/components/atoms/Button';

export default function LoginScreen() {
  const { handleLogin, handleGoogleLogin, handleAppleLogin, handleForgotPassword, mockLogin, isLoading } =
    useLoginScreen();

  return (
    <SafeAreaView style={styles.safe}>
      <BackButton />
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <LoginCard
            onLogin={handleLogin}
            onLoginWithGoogle={handleGoogleLogin}
            onLoginWithApple={handleAppleLogin}
            onForgotPassword={handleForgotPassword}
            isLoading={isLoading}
          />
          <Link href="/register" style={styles.footerLink}>
            <Text variant={TEXT_VARIANTS.Callout} color={TEXT_COLORS.TextSecondary}>
              {translate('login.noAccount')} {translate('login.signUp')}
            </Text>
          </Link>
          <LoginFooter />
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
  devButton: {
    marginTop: theme.spacing[4],
  },
  footerLink: {
    alignSelf: 'center',
    marginTop: theme.spacing[4],
  },
}));
