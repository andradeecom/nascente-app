import { useGoogleLogin, useRegister } from '@/hooks/use-auth';
import { translate } from '@/i18n';
import Toast from 'react-native-toast-message';

export default function useRegisterScreen() {
  const registerMutation = useRegister();
  const googleLoginMutation = useGoogleLogin();

  const handleRegister = (data: { email: string; password: string; firstName: string; lastName: string }) => {
    registerMutation.mutate(data, {
      onError: (error) => {
        Toast.show({
          type: 'error',
          text1: translate('errors.registerFailed'),
          text2: error instanceof Error ? error.message : translate('errors.generic'),
        });
      },
    });
  };

  const handleGoogleRegister = () => {
    googleLoginMutation.mutate(undefined, {
      onError: (error) => {
        if (error instanceof Error && error.message === 'Google sign-in was cancelled') {
          return;
        }
        Toast.show({
          type: 'error',
          text1: translate('errors.registerFailed'),
          text2: error instanceof Error ? error.message : translate('errors.generic'),
        });
      },
    });
  };

  const handleAppleRegister = () => {
    // TODO: Implement Apple OAuth
  };

  return {
    handleRegister,
    handleGoogleRegister,
    handleAppleRegister,
    isLoading: registerMutation.isPending,
  };
}
