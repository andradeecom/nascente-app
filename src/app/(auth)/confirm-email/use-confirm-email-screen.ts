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

  // Land a freshly-confirmed account on Home — the app itself, not Settings.
  // Deliberately does NOT try to resume a Pro purchase the user may have been
  // attempting: account creation and the paywall are separate flows (see the
  // Paywall + RevenueCat section in CLAUDE.md), and the confirmation link
  // cold-launches from Mail with no navigation stack to return into. A user who
  // wanted Pro meets the Pro gate again on Home, now signed in and one tap away.
  const handleContinue = () => router.replace('/(tabs)');
  const handleGoToLogin = () => router.replace('/login');

  return { status, handleContinue, handleGoToLogin };
}
