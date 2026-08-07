import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_STORAGE_KEY, supabase } from '@/lib/supabase';
import { syncPostHogIdentity, syncRevenueCatIdentity, useAuthStore } from '@/stores/auth';
import { capture } from '@/lib/posthog';
import { useLocaleStore } from '@/stores/locale';
import { useSyncMetaStore } from '@/services/sync/sync-meta';
import { useHighlightsStore } from '@/stores/highlights';
import { useBookmarksStore } from '@/stores/bookmarks';
import { useNotesStore } from '@/stores/notes';
import { usePlanEnrollmentsStore } from '@/stores/plan-enrollments';
import { usePlanCompletionsStore } from '@/stores/plan-completions';
import { callDeleteAccount } from '@/services/delete-account';
import { toAppUser, type AppUser, type RegisterRequest } from '@/types/auth';
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
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
      capture('signed_in', { method: 'email' });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async ({ email, password, firstName, lastName }: RegisterRequest) => {
      // Sent BOTH ways on purpose (see the send-email hook's locale resolution):
      //  - on `emailRedirectTo`, which the hook prefers — it's the language the
      //    device is in at this moment, and can't be raced by a slow metadata write.
      //  - into `user_metadata`, which persists for LATER emails this account may
      //    trigger (e.g. an email change), and must be stamped here rather than
      //    after, since the confirmation email is sent by this very call.
      const locale = useLocaleStore.getState().locale ?? 'pt';
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { firstName, lastName, locale },
          emailRedirectTo: `nascenteapp://confirm-email?locale=${locale}`,
        },
      });
      if (error) throw error;
      // With email confirmation enabled, `signUp` returns a user but NO session
      // until the confirmation link is followed — `data.session` is the only
      // reliable signal of which case this is (an already-confirmed/existing
      // email also comes back with `session: null` here, same shape).
      return { user: toAppUser(data.user!), needsConfirmation: data.session === null };
    },
    onSuccess: ({ user, needsConfirmation }) => {
      // Captured before the early return so the "signed up but never confirmed"
      // drop-off is visible — that's the interesting cohort, and it has no session.
      capture('signed_up', { method: 'email', needs_confirmation: needsConfirmation });
      if (needsConfirmation) return;
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
      capture('signed_in', { method: 'google' });
    },
  });
}

export function useAppleLogin() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async () => {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const idToken = credential.identityToken;
      if (!idToken) {
        throw new Error('No ID token received from Apple');
      }

      const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: idToken });
      if (error) throw error;

      // Apple only returns the user's name on the FIRST sign-in ever; on later
      // sign-ins fullName is null. Persist it into user_metadata (our firstName/
      // lastName keys, so toAppUser picks it up) the one time we get it — otherwise
      // the account would have no name. signInWithIdToken doesn't set these itself.
      const { givenName, familyName } = credential.fullName ?? {};
      if (givenName || familyName) {
        const { data: updated } = await supabase.auth.updateUser({
          data: { firstName: givenName ?? '', lastName: familyName ?? '' },
        });
        if (updated.user) return toAppUser(updated.user);
      }

      return toAppUser(data.user);
    },
    onSuccess: (user) => {
      setAuth(user);
      queryClient.setQueryData(authKeys.me, user);
      capture('signed_in', { method: 'apple' });
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
      // Carry the device's CURRENT language on the redirect so the send-email hook
      // can localize the email. This is a signed-out flow — there's no session, so
      // `user_metadata.locale` can't have been synced, and without this param the
      // hook falls back to whatever was stored at signup (a real bug: switch to
      // Spanish → log out → reset password → email arrives in Portuguese).
      // `reset-password`'s screen ignores the extra param; only the hook reads it.
      const locale = useLocaleStore.getState().locale ?? 'pt';
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `nascenteapp://reset-password?locale=${locale}`,
      });
      if (error) throw error;
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password });
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
    // mock-login user (no session) throws above and never fires it — so we reset
    // here too. Both paths go through `syncRevenueCatIdentity`, whose synchronous
    // id guard means the SDK's `logOut()` runs exactly once: calling it twice throws
    // "the current user is anonymous" (and an `isAnonymous()` pre-check can't fix
    // that — it isn't atomic with the call; see the note in lib/revenuecat.ts).
    syncRevenueCatIdentity(null);

    // Same rationale for analytics: reset to an anonymous distinct id so the next
    // account on this device doesn't inherit the previous person's identity. Fired
    // here (not only from the auth listener) because a mock-login user throws above
    // and never reaches it. Capture before the reset — after it, the event would be
    // attributed to the new anonymous id rather than the user who signed out.
    capture('signed_out');
    syncPostHogIdentity(null);

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

/**
 * Permanently delete the signed-in user's account (App Store Guideline 5.1.1(v)
 * requires an in-app way to initiate this). Order matters:
 *
 *   1. Delete server-side FIRST, via the `delete-account` Edge Function. If it
 *      fails we surface the error with the session still intact, so the user can
 *      retry — wiping locally first would sign them out of an account that still
 *      exists, leaving them no way back in to try again.
 *   2. Hard-purge this device's per-user rows. `useLogout` deliberately leaves
 *      these (they filter by user id, and un-pushed writes flush on re-login),
 *      but that reasoning inverts here: the account is gone, so there is nothing
 *      left to sync to and those rows would be stranded forever. This is also
 *      why it's a HARD delete, not the `clearAll*` tombstone path — a tombstone
 *      exists to propagate a deletion that no longer has anywhere to go.
 *   3. Reuse `useLogout` for the rest of the teardown (auth store, query cache,
 *      sync cursors, RevenueCat + PostHog identity, persisted-token purge) so
 *      the sign-out sequence lives in exactly one place.
 *
 * The device-global reading progress/streak store is intentionally NOT purged:
 * it isn't keyed per user (see CLAUDE.md → Reading progress tracking), it's the
 * one surface that works for guests, and clearing it would wipe the reading
 * history of whoever keeps using the app on this device afterwards.
 */
export function useDeleteAccount() {
  const logout = useLogout();

  return useMutation({
    mutationFn: async () => {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) throw new Error('Not authenticated');

      await callDeleteAccount();

      useHighlightsStore.getState().purgeUser(userId);
      useBookmarksStore.getState().purgeUser(userId);
      useNotesStore.getState().purgeUser(userId);
      usePlanEnrollmentsStore.getState().purgeUser(userId);
      usePlanCompletionsStore.getState().purgeUser(userId);

      // Captured before logout resets the analytics identity — afterwards the
      // event would be attributed to a fresh anonymous id, not the person who
      // actually deleted their account.
      capture('account_deleted');

      await logout();
    },
  });
}
