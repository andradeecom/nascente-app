import { useRouter } from 'expo-router';
import { useAppleLogin, useGoogleLogin, useRegister } from '@/hooks/use-auth';
import { translate } from '@/i18n';
import Toast from 'react-native-toast-message';

export default function useRegisterScreen() {
  const router = useRouter();
  const registerMutation = useRegister();
  const googleLoginMutation = useGoogleLogin();
  const appleLoginMutation = useAppleLogin();

  // Reached from settings (guest sign-up), pushed on top of the (tabs) stack.
  // Auth no longer swaps the navigator, so dismiss back to settings on success.
  const goToApp = () => {
    if (router.canDismiss()) {
      router.dismissAll();
    } else {
      router.replace('/(tabs)/settings');
    }
  };

  const handleRegister = (data: { email: string; password: string; firstName: string; lastName: string }) => {
    registerMutation.mutate(data, {
      onSuccess: goToApp,
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
      onSuccess: goToApp,
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
    appleLoginMutation.mutate(undefined, {
      onSuccess: goToApp,
      onError: (error) => {
        // ERR_REQUEST_CANCELED = user dismissed the Apple sheet; swallow it like Google's cancel.
        if (error instanceof Error && 'code' in error && error.code === 'ERR_REQUEST_CANCELED') {
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

  return {
    handleRegister,
    handleGoogleRegister,
    handleAppleRegister,
    isLoading: registerMutation.isPending,
  };
}
