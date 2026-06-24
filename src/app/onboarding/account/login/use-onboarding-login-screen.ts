import { useRouter } from 'expo-router';
import { useGoogleLogin, useLogin, useMockLogin } from '@/hooks/use-auth';
import { translate } from '@/i18n';
import Toast from 'react-native-toast-message';

export default function useOnboardingLoginScreen() {
  const router = useRouter();
  const loginMutation = useLogin();
  const googleLoginMutation = useGoogleLogin();
  const mockLogin = useMockLogin();

  const goToWelcome = () => router.replace('/onboarding/welcome');

  const handleLogin = (email: string, password: string) => {
    loginMutation.mutate(
      { email, password },
      {
        onSuccess: goToWelcome,
        onError: (error) => {
          Toast.show({
            type: 'error',
            text1: translate('errors.loginFailed'),
            text2: error instanceof Error ? error.message : translate('errors.invalidCredentials'),
          });
        },
      }
    );
  };

  const handleGoogleLogin = () => {
    googleLoginMutation.mutate(undefined, {
      onSuccess: goToWelcome,
      onError: (error) => {
        if (error instanceof Error && error.message === 'Google sign-in was cancelled') {
          return;
        }
        Toast.show({
          type: 'error',
          text1: translate('errors.loginFailed'),
          text2: error instanceof Error ? error.message : translate('errors.invalidCredentials'),
        });
      },
    });
  };

  const handleAppleLogin = () => {
    // TODO: Implement Apple OAuth
  };

  const handleForgotPassword = () => {
    router.push('/onboarding/account/forgot-password');
  };

  const handleMockLogin = () => {
    mockLogin();
    goToWelcome();
  };

  const handleBack = () => router.back();

  return {
    handleLogin,
    handleGoogleLogin,
    handleAppleLogin,
    handleForgotPassword,
    handleBack,
    mockLogin: handleMockLogin,
    isLoading: loginMutation.isPending,
  };
}
