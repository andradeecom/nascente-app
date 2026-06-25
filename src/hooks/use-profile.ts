import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import type { AccountTier } from '@/types/subscription';

export const profileKeys = {
  all: ['profile'] as const,
  me: ['profile', 'me'] as const,
};

/**
 * The current user's profile row (subscription tier lives here). Tier is
 * server/billing-controlled — the client only reads it. A missing profile
 * (e.g. a dev mock-login user with no Supabase row) degrades to 'free'.
 */
export function useProfile() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: profileKeys.me,
    enabled: isAuthenticated && !!user,
    queryFn: async (): Promise<{ tier: AccountTier }> => {
      const { data, error } = await supabase.from('profiles').select('tier').eq('id', user!.id).maybeSingle();

      if (error) throw error;
      return { tier: data?.tier ?? 'free' };
    },
    staleTime: 1000 * 60 * 5, // tier rarely changes within a session
  });
}

/** Convenience: the current tier (defaults to 'free' until loaded / for guests). */
export function useTier(): AccountTier {
  return useProfile().data?.tier ?? 'free';
}

/** Convenience: whether the current user is on the Pro tier. */
export function useIsPro(): boolean {
  return useTier() === 'pro';
}
