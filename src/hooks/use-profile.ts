import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useIsProRevenueCat } from '@/hooks/use-revenuecat';
import { capture } from '@/lib/posthog';
import type { AccountTier } from '@/types/subscription';
import type { ProGateSource } from '@/types/analytics';

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

/**
 * The single entry point to the Pro upsell, for every Pro-gated surface.
 *
 * **An account is a hard precondition for Pro** — a purchase must bind to a real
 * Supabase user id so RevenueCat identity and the webhook's `profiles.tier` grant
 * have somewhere to land. A guest purchase would attach to an anonymous
 * RevenueCat id that's lost on reinstall/device-switch, i.e. the user pays and
 * silently loses access. So **guests never reach `/paywall` at all**: `openPro()`
 * sends them to `/register` instead.
 *
 * Account creation and purchase are deliberately **separate flows** — signing up
 * does not hand off back to the paywall (no `returnTo`, no cross-session resume
 * state). Email confirmation cold-launches the app from Mail with no navigation
 * stack to return into, so any "resume the purchase" promise is expensive and
 * fragile; instead the user lands in the app and meets the Pro gate again, now
 * one tap from the paywall.
 *
 * Call sites should use `openPro()` rather than pushing `/paywall` directly, and
 * pair it with `requiresAccount` to disclose the precondition up front (e.g.
 * `ProLockCard`'s `hint`) rather than surprising the user after they tap.
 */
export function useProGate() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const openPro = useCallback(
    (source: ProGateSource) => {
      // Because every Pro-gated surface routes through here, this one capture is
      // complete upsell attribution — it answers "which locked feature actually
      // drives demand" without instrumenting each surface separately. Keep new
      // gates going through `openPro` rather than pushing /paywall directly, or
      // they'll be invisible in the funnel.
      capture('pro_gate_hit', { source, requires_account: !isAuthenticated });
      router.push(isAuthenticated ? '/paywall' : '/register');
    },
    [router, isAuthenticated]
  );

  return { openPro, requiresAccount: !isAuthenticated };
}
