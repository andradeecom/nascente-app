import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { resolveAuthLink, type AuthLinkParams } from '@/lib/auth-link';

type Status = 'resolving' | 'success' | 'error';

export default function useConfirmEmailScreen() {
  const params = useLocalSearchParams<AuthLinkParams>();
  const [status, setStatus] = useState<Status>('resolving');
  // `useLocalSearchParams` returns a new object identity on every render, and a
  // PKCE auth code is single-use — exchanging it twice fails the second time even
  // when the params haven't actually changed. Guard on the scalar values (below)
  // AND this ref, so a re-render can never re-trigger the network call.
  const resolvedRef = useRef(false);

  // Destructure the scalar fields (stable primitives) rather than depending on
  // `params` itself, whose object identity changes every render — that would let
  // the effect below re-fire and exchange a single-use PKCE code twice.
  const { code, error, error_code: errorCode, error_description: errorDescription } = params;

  useEffect(() => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;

    resolveAuthLink({ code, error, error_code: errorCode, error_description: errorDescription }).then((result) => {
      setStatus(result.status);
      if (result.status === 'error' && __DEV__) {
        console.warn('[confirm-email] auth link error', result.code, result.description);
      }
    });
  }, [code, error, errorCode, errorDescription]);

  const handleContinue = () => router.replace('/(tabs)/settings');
  const handleGoToLogin = () => router.replace('/login');

  return { status, handleContinue, handleGoToLogin };
}
