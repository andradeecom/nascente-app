import { useState } from 'react';
import { useForgotPassword } from '@/hooks/use-auth';
import { translate } from '@/i18n';
import Toast from 'react-native-toast-message';

export default function useForgotPasswordScreen() {
  const forgotPasswordMutation = useForgotPassword();
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const handleSubmit = (email: string) => {
    forgotPasswordMutation.mutate(email, {
      onSuccess: () => {
        setSubmittedEmail(email);
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
    isLoading: forgotPasswordMutation.isPending,
    isSubmitted: submittedEmail !== null,
    submittedEmail,
  };
}
