import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { CustomerInfo, PurchasesOffering } from 'react-native-purchases';
import {
  addCustomerInfoUpdateListener,
  getCurrentOffering,
  getCustomerInfo,
  isProActive,
  isRevenueCatConfigured,
} from '@/lib/revenuecat';
import { useAuthStore } from '@/stores/auth';

export const revenueCatKeys = {
  all: ['revenuecat'] as const,
  customerInfo: ['revenuecat', 'customerInfo'] as const,
  offerings: ['revenuecat', 'offerings'] as const,
};

/**
 * The current RevenueCat customer info (entitlements), kept live. Seeds from
 * `getCustomerInfo()` and then subscribes to the SDK's update listener, pushing
 * every update (purchase / restore / renewal / cross-device) straight into the
 * query cache — so `useIsProRevenueCat` flips the instant a purchase completes,
 * without waiting on the webhook → `profiles.tier` round-trip.
 *
 * Gated on a configured SDK + a signed-in user (guests can't purchase). Returns
 * undefined data when the SDK isn't configured (Expo Go / no key).
 */
export function useCustomerInfo() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id) ?? null;
  const enabled = isRevenueCatConfigured() && userId != null;

  const query = useQuery({
    queryKey: revenueCatKeys.customerInfo,
    enabled,
    queryFn: (): Promise<CustomerInfo | null> => getCustomerInfo(),
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!enabled) return;
    // Mirror live updates into the cache so all useIsPro consumers react.
    return addCustomerInfoUpdateListener((info) => {
      queryClient.setQueryData(revenueCatKeys.customerInfo, info);
    });
  }, [enabled, queryClient]);

  return query;
}

/** Whether RevenueCat reports the Pro entitlement active for the current user. */
export function useIsProRevenueCat(): boolean {
  return isProActive(useCustomerInfo().data);
}

/**
 * The current RevenueCat offering (annual/monthly packages) for the paywall.
 * Returns null when the SDK isn't configured / no offering is set, so the paywall
 * can fall back to its i18n placeholder prices.
 */
export function useProOfferings() {
  const enabled = isRevenueCatConfigured();

  return useQuery({
    queryKey: revenueCatKeys.offerings,
    enabled,
    queryFn: (): Promise<PurchasesOffering | null> => getCurrentOffering(),
    staleTime: 1000 * 60 * 30, // offerings rarely change within a session
  });
}
