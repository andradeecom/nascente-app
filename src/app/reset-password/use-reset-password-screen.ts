import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useResetPassword } from '@/hooks/use-auth';
import { resolveAuthLink, type AuthLinkParams } from '@/lib/auth-link';
import { translate } from '@/i18n';

type LinkStatus = 'resolving' | 'ready' | 'error';

export default function useResetPasswordScreen() {
  const params = useLocalSearchParams<AuthLinkParams>();
  const [linkStatus, setLinkStatus] = useState<LinkStatus>('resolving');
  const resetPasswordMutation = useResetPassword();
  // `useLocalSearchParams` returns a new object identity on every render, and a
  // PKCE auth code is single-use — exchanging it twice fails the second time even
  // when the params haven't actually changed. Guard on the scalar values (below)
  // AND this ref, so a re-render can never re-trigger the network call.
  const resolvedRef = useRef(false);

  // Destructure the scalar fields (stable primitives) rather than depending on
  // `params` itself, whose object identity changes every render — that would let
  // the effect below re-fire and exchange a single-use PKCE code twice.
  const { code, error: linkError, error_code: errorCode, error_description: errorDescription } = params;

  // The deep link only carries a `code` to exchange for the recovery session —
  // `updateUser({ password })` below has nothing to act on until that session
  // exists, so resolve it once before the form becomes usable.
  useEffect(() => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;

    resolveAuthLink({ code, error: linkError, error_code: errorCode, error_description: errorDescription }).then(
      (result) => {
        setLinkStatus(result.status === 'success' ? 'ready' : 'error');
        if (result.status === 'error' && __DEV__) {
          console.warn('[reset-password] auth link error', result.code, result.description);
        }
      }
    );
  }, [code, linkError, errorCode, errorDescription]);

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

  const handleGoToForgotPassword = () => router.replace('/forgot-password');

  return {
    linkStatus,
    handleSubmit,
    handleGoToForgotPassword,
    isLoading: resetPasswordMutation.isPending,
  };
}
