import { useResetPassword } from '@/hooks/use-auth';
import { translate } from '@/i18n';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

export default function useResetPasswordScreen() {
  const resetPasswordMutation = useResetPassword();

  const handleSubmit = (password: string) => {
    resetPasswordMutation.mutate(password, {
      onSuccess: () => {
        Toast.show({
          type: 'success',
          text1: translate('resetPassword.successTitle'),
        });
        router.replace('/login');
      },
      onError: (error) => {
        Toast.show({
          type: 'error',
          text1: translate('errors.resetPasswordFailed'),
          text2: error instanceof Error ? error.message : translate('errors.generic'),
        });
      },
    });
  };

  return {
    handleSubmit,
    isLoading: resetPasswordMutation.isPending,
  };
}
