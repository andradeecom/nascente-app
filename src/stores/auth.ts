import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { identifyRevenueCat, resetRevenueCat } from '@/lib/revenuecat';
import { identifyUser, resetIdentity } from '@/lib/posthog';
import { toAppUser, type AppUser } from '@/types/auth';

// Last RevenueCat-identified user id, so token refreshes (which re-fire
// onAuthStateChange with the same user) don't spam logIn. Best-effort: RevenueCat
// failures are swallowed so they never block auth state updates.
let lastRevenueCatUserId: string | null = null;

// Same guard, same reason, for PostHog — see `syncPostHogIdentity` below.
let lastPostHogUserId: string | null = null;

/**
 * The single seam for RevenueCat identity. The `lastRevenueCatUserId` check is
 * **synchronous** (set before any await), which is what makes this safe to call
 * from several places during one sign-out: only the first call reaches the SDK.
 * That matters because `Purchases.logOut()` throws "the current user is anonymous"
 * if it runs twice, and an async `isAnonymous()` pre-check can't prevent it (the
 * check isn't atomic with the call — RevenueCat/purchases-flutter#934).
 *
 * Exported so `useLogout` can reset identity through the same guard rather than
 * calling `resetRevenueCat()` directly and racing the auth listener.
 */
export function syncRevenueCatIdentity(userId: string | null): void {
  if (userId === lastRevenueCatUserId) return;
  lastRevenueCatUserId = userId;
  if (userId) {
    void identifyRevenueCat(userId).catch(() => {});
  } else {
    void resetRevenueCat().catch(() => {});
  }
}

/**
 * The single seam for PostHog identity, mirroring `syncRevenueCatIdentity` above
 * (same call sites, same synchronous-guard rationale).
 *
 * The guard matters for the same reason it does for RevenueCat: `onAuthStateChange`
 * re-fires on every token refresh with the same user, and re-`identify()`ing on each
 * one would issue a redundant person-profile write per refresh.
 *
 * `userId` is the Supabase `auth.users.id` — deliberately the same distinct id
 * RevenueCat uses as `app_user_id` and the AI Edge Functions use for
 * `$ai_generation`, so product events, revenue and AI cost all join to one person.
 *
 * Exported so `useLogout` can reset through the same guard rather than calling
 * `resetIdentity()` directly and racing the auth listener.
 */
export function syncPostHogIdentity(userId: string | null): void {
  if (userId === lastPostHogUserId) return;
  lastPostHogUserId = userId;
  if (userId) {
    identifyUser(userId);
  } else {
    resetIdentity();
  }
}

type AuthState = {
  user: AppUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setAuth: (user: AppUser) => void;
  clearAuth: () => void;
  hydrate: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isHydrated: false,

  setAuth: (user: AppUser) => {
    set({ user, isAuthenticated: true });
  },

  clearAuth: () => {
    set({ user: null, isAuthenticated: false });
  },

  hydrate: async () => {
    const { data } = await supabase.auth.getSession();
    const sessionUser = data.session?.user;

    if (sessionUser) {
      set({ user: toAppUser(sessionUser), isAuthenticated: true, isHydrated: true });
      syncRevenueCatIdentity(sessionUser.id);
      syncPostHogIdentity(sessionUser.id);
    } else {
      set({ isHydrated: true });
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        set({ user: toAppUser(session.user), isAuthenticated: true });
        syncRevenueCatIdentity(session.user.id);
        syncPostHogIdentity(session.user.id);
      } else {
        set({ user: null, isAuthenticated: false });
        syncRevenueCatIdentity(null);
        syncPostHogIdentity(null);
      }
    });
  },
}));
