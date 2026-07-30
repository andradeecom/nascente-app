import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAppleLogin, useGoogleLogin, useRegister } from '@/hooks/use-auth';
import { translate } from '@/i18n';
import Toast from 'react-native-toast-message';

export default function useOnboardingRegisterScreen() {
  const router = useRouter();
  const registerMutation = useRegister();
  const googleLoginMutation = useGoogleLogin();
  const appleLoginMutation = useAppleLogin();
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const goToWelcome = () => router.replace('/onboarding/welcome');

  const handleRegister = (data: { email: string; password: string; firstName: string; lastName: string }) => {
    registerMutation.mutate(data, {
      onSuccess: ({ needsConfirmation }) => {
        if (needsConfirmation) {
          setSubmittedEmail(data.email);
          return;
        }
        goToWelcome();
      },
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
    appleLoginMutation.mutate(undefined, {
      onSuccess: goToWelcome,
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

  const handleBack = () => router.back();

  return {
    handleRegister,
    handleGoogleRegister,
    handleAppleRegister,
    handleBack,
    isLoading: registerMutation.isPending,
    needsConfirmation: submittedEmail !== null,
    submittedEmail,
  };
}
