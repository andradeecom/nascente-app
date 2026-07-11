import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_STORAGE_KEY, supabase } from '@/lib/supabase';
import { resetRevenueCat } from '@/lib/revenuecat';
import { useAuthStore } from '@/stores/auth';
import { useSyncMetaStore } from '@/services/sync/sync-meta';
import { toAppUser, type AppUser, type RegisterRequest } from '@/types/auth';
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

export const authKeys = {
  me: ['auth', 'me'] as const,
};

export function useLogin() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return toAppUser(data.user);
    },
    onSuccess: (user) => {
      setAuth(user);
      queryClient.setQueryData(authKeys.me, user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async ({ email, password, firstName, lastName }: RegisterRequest) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { firstName, lastName } },
      });
      if (error) throw error;
      return toAppUser(data.user!);
    },
    onSuccess: (user) => {
      setAuth(user);
      queryClient.setQueryData(authKeys.me, user);
    },
  });
}

export function useGoogleLogin() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async () => {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response)) {
        throw new Error('Google sign-in was cancelled');
      }

      const idToken = response.data.idToken;
      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
      if (error) throw error;
      return toAppUser(data.user);
    },
    onSuccess: (user) => {
      setAuth(user);
      queryClient.setQueryData(authKeys.me, user);
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    // Updates the editable profile fields (first/last name, photo). These live in
    // Supabase auth `user_metadata`, so `updateUser({ data })` is the write path — it
    // returns the refreshed user, which we map + push to the store and query cache so
    // the UI updates immediately (the onAuthStateChange USER_UPDATED listener also
    // fires, but we don't wait on its async round-trip). Email is intentionally not
    // editable here (changing it triggers a re-confirmation flow — out of scope).
    mutationFn: async ({
      firstName,
      lastName,
      profileImageUrl,
    }: {
      firstName: string;
      lastName: string;
      profileImageUrl?: string | null;
    }) => {
      const { data, error } = await supabase.auth.updateUser({
        data: { firstName, lastName, profileImageUrl },
      });
      if (error) throw error;
      return toAppUser(data.user);
    },
    onSuccess: (user) => {
      setAuth(user);
      queryClient.setQueryData(authKeys.me, user);
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'nascenteapp://reset-password',
      });
      if (error) throw error;
    },
  });
}

export function useMe() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: authKeys.me,
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return toAppUser(data.user);
    },
    enabled: isAuthenticated,
  });
}

export function useMockLogin() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return async () => {
    const mockUser: AppUser = {
      id: 'mock-user-id',
      email: 'mock@example.com',
      firstName: 'Mock',
      lastName: 'User',
      profileImageUrl: null,
    };
    setAuth(mockUser);
    queryClient.setQueryData(authKeys.me, mockUser);
  };
}

export function useLogout() {
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return async () => {
    // Capture the signed-out user before clearing, so we can reset their sync
    // cursors (a re-login then does a clean full re-pull). The study stores stay
    // untouched — they filter by user id, so logout already shows nothing, and
    // any un-pushed dirty rows flush on the next sign-in of that account.
    const previousUserId = useAuthStore.getState().user?.id;

    // Clear local auth + all cached queries FIRST so the UI flips to guest and no
    // previous-user data lingers (e.g. the Plans tab).
    clearAuth();
    queryClient.clear();
    if (previousUserId) useSyncMetaStore.getState().clearForUser(previousUserId);

    // Best-effort remote revoke (needs network; throws for a mock-login user with
    // no session). The token removal below is what actually guarantees sign-out.
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore — hard purge below is the guarantee
    }

    // Reset RevenueCat to an anonymous user so Pro doesn't leak across accounts on
    // this device. The auth listener also resets on a successful signOut, but a
    // mock-login user (no session) throws above and never fires it — do it here too.
    try {
      await resetRevenueCat();
    } catch {
      // ignore — entitlement gating also re-checks on next sign-in
    }

    // Hard guarantee: delete the persisted session from storage so a failed or
    // offline remote sign-out can't leave a token for hydrate() to restore on
    // relaunch. Supabase keeps the session under AUTH_STORAGE_KEY (+ a
    // `-code-verifier` sibling for PKCE), so purge anything with that prefix.
    try {
      const keys = await AsyncStorage.getAllKeys();
      const authKeys = keys.filter((key) => key.startsWith(AUTH_STORAGE_KEY));
      if (authKeys.length > 0) {
        await AsyncStorage.multiRemove(authKeys);
      }
    } catch {
      // ignore — store/cache already cleared; nothing more we can do here
    }
  };
}
