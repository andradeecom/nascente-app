import 'react-native-url-polyfill/auto';
import { install } from 'react-native-quick-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

/**
 * Polyfills `global.crypto` (incl. `crypto.subtle.digest`) with a native
 * implementation. Hermes has no WebCrypto support, so without this `auth-js`'s
 * `generatePKCEChallenge` silently falls back to `code_challenge_method=plain`
 * (the raw verifier as the challenge — real hashing skipped) and logs "WebCrypto
 * API is not supported." `install` is a named export (NOT a method on the
 * default `QuickCrypto` export, which only mirrors Node's `crypto` shape).
 * Must run before `createClient` below.
 */
install();

/**
 * Explicit storage key for the persisted Supabase session. Pinned (rather than
 * relying on the derived `sb-<ref>-auth-token` default) so logout can hard-purge
 * the token from AsyncStorage by prefix — Supabase keeps related entries under
 * `${AUTH_STORAGE_KEY}` and `${AUTH_STORAGE_KEY}-code-verifier`.
 */
export const AUTH_STORAGE_KEY = 'nascente-auth';

export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      storageKey: AUTH_STORAGE_KEY,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      // PKCE (not the SDK's 'implicit' default) so signup-confirmation/password-reset/
      // email-change redirects carry `?code=`/`?error_code=` as query params instead of
      // a `#` fragment — expo-router's deep-link parser drops fragments entirely, which
      // silently broke every one of those flows under the implicit flow. See the auth
      // flow section in CLAUDE.md.
      flowType: 'pkce',
    },
  }
);
