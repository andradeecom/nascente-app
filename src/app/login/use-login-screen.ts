import { useGoogleLogin, useLogin, useMockLogin } from '@/hooks/use-auth';
import { translate } from '@/i18n';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

export default function useLoginScreen() {
  const router = useRouter();
  const loginMutation = useLogin();
  const googleLoginMutation = useGoogleLogin();
  const mockLogin = useMockLogin();

  const handleLogin = (email: string, password: string) => {
    loginMutation.mutate(
      { email, password },
      {
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
      onError: (error) => {
        if (error instanceof Error && error.message === 'Google sign-in was cancelled') {
          return;
        }
        console.log('Google login error:', error);
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
    router.push('/forgot-password');
  };

  return {
    handleLogin,
    handleGoogleLogin,
    handleAppleLogin,
    handleForgotPassword,
    mockLogin,
    isLoading: loginMutation.isPending,
  };
}
