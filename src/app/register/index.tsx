import { RegisterCard } from '@/components/organisms';
import { translate } from '@/i18n';
import { Link } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, TextVariants, SafeAreaView } from '@/components/atoms';
import useRegisterScreen from './use-register-screen';

export default function RegisterScreen() {
  const { handleRegister, handleGoogleRegister, handleAppleRegister, isLoading } = useRegisterScreen();

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <RegisterCard
            onRegister={handleRegister}
            onRegisterWithGoogle={handleGoogleRegister}
            onRegisterWithApple={handleAppleRegister}
            isLoading={isLoading}
          />
          <Link href="/login" style={styles.footerLink}>
            <Text variant={TextVariants.Callout} color="textSecondary">
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
