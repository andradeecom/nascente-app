import { supabase } from '@/lib/supabase';

/**
 * Shape of the query params a Supabase PKCE auth-callback deep link (signup
 * confirmation, password recovery, email-change) lands with — either a `code` to
 * exchange for a session, or an error triple when the link is expired/invalid/
 * already used. Both outcomes arrive as `?` query params under the PKCE flow (see
 * `src/lib/supabase.ts`), which is what makes them reachable via expo-router's
 * `useLocalSearchParams` at all — the fragment-based implicit flow never was.
 */
export type AuthLinkParams = {
  code?: string;
  error?: string;
  error_code?: string;
  error_description?: string;
};

export type AuthLinkResult = { status: 'success' } | { status: 'error'; code?: string; description?: string };

/**
 * Resolves an auth-callback deep link: exchanges a `code` for a session, or
 * surfaces the error Supabase already classified (e.g. `otp_expired` for a stale
 * or already-used link). Shared by the confirm-email and reset-password screens —
 * both are PKCE callbacks that only differ in what they show/do once resolved.
 */
export async function resolveAuthLink(params: AuthLinkParams): Promise<AuthLinkResult> {
  if (params.error || params.error_code) {
    return { status: 'error', code: params.error_code, description: params.error_description };
  }

  if (!params.code) {
    return { status: 'error' };
  }

  const { error } = await supabase.auth.exchangeCodeForSession(params.code);
  if (error) {
    return { status: 'error', code: error.code, description: error.message };
  }

  return { status: 'success' };
}
