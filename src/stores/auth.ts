import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { identifyRevenueCat, resetRevenueCat } from '@/lib/revenuecat';
import { toAppUser, type AppUser } from '@/types/auth';

// Last RevenueCat-identified user id, so token refreshes (which re-fire
// onAuthStateChange with the same user) don't spam logIn. Best-effort: RevenueCat
// failures are swallowed so they never block auth state updates.
let lastRevenueCatUserId: string | null = null;

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
    } else {
      set({ isHydrated: true });
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        set({ user: toAppUser(session.user), isAuthenticated: true });
        syncRevenueCatIdentity(session.user.id);
      } else {
        set({ user: null, isAuthenticated: false });
        syncRevenueCatIdentity(null);
      }
    });
  },
}));
