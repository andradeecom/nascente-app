import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

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
    },
  }
);
