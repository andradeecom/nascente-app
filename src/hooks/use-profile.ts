import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useIsProRevenueCat } from '@/hooks/use-revenuecat';
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

/**
 * The current tier from `profiles.tier` (defaults to 'free' until loaded / for
 * guests). This stays the **server-authoritative** value — it backs the numeric
 * `ACTIVE_PLAN_LIMIT` lookup, which must match what the DB plan-cap trigger
 * computes from the same column. Use `useIsPro` (not `useTier() === 'pro'`) for
 * boolean feature gating so a just-completed purchase unlocks instantly.
 */
export function useTier(): AccountTier {
  return useProfile().data?.tier ?? 'free';
}

/**
 * Whether the current user has Pro for **feature gating**. True if RevenueCat
 * reports the entitlement active (instant, SDK-cached — unlocks the moment a
 * purchase completes) OR `profiles.tier` is 'pro' (the server-authoritative
 * backstop the webhook flips, and what the DB plan-cap trigger enforces).
 */
export function useIsPro(): boolean {
  const isProRevenueCat = useIsProRevenueCat();
  const tier = useTier();
  return isProRevenueCat || tier === 'pro';
}
