import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
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
    await supabase.auth.signOut();
    clearAuth();
    queryClient.clear();
  };
}
