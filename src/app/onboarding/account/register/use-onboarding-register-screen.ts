import { useRouter } from 'expo-router';
import { useGoogleLogin, useRegister } from '@/hooks/use-auth';
import { translate } from '@/i18n';
import Toast from 'react-native-toast-message';

export default function useOnboardingRegisterScreen() {
  const router = useRouter();
  const registerMutation = useRegister();
  const googleLoginMutation = useGoogleLogin();

  const goToWelcome = () => router.replace('/onboarding/welcome');

  const handleRegister = (data: { email: string; password: string; firstName: string; lastName: string }) => {
    registerMutation.mutate(data, {
      onSuccess: goToWelcome,
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
      onSuccess: goToWelcome,
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

  const handleBack = () => router.back();

  return {
    handleRegister,
    handleGoogleRegister,
    handleAppleRegister,
    handleBack,
    isLoading: registerMutation.isPending,
  };
}
