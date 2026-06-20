import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { toAppUser, type AppUser } from '@/types/auth';

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
    } else {
      set({ isHydrated: true });
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        set({ user: toAppUser(session.user), isAuthenticated: true });
      } else {
        set({ user: null, isAuthenticated: false });
      }
    });
  },
}));
