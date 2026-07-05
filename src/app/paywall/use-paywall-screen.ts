import { useCallback, useMemo, useState } from 'react';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import type { PurchasesPackage } from 'react-native-purchases';
import { useTranslate } from '@/i18n';
import { useProOfferings, revenueCatKeys } from '@/hooks/use-revenuecat';
import { isProActive, isUserCancelledError, purchasePackage, restorePurchases } from '@/lib/revenuecat';
import { DEFAULT_PRO_OFFER, type ProBillingCycle } from '@/types/subscription';
import type { PaywallOffer } from '@/components/organisms';

const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL || 'https://nascente.app/terms';
const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL || 'https://nascente.app/privacy';

/**
 * Screen-private logic for the Pro paywall. Pulls live offerings from RevenueCat
 * (store-localized prices) and drives the real purchase/restore flow, falling back
 * to the i18n placeholder prices when offerings haven't loaded / the SDK isn't
 * configured (Expo Go, no key) so the screen always renders.
 */
export default function usePaywallScreen() {
  const translate = useTranslate();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: offering } = useProOfferings();
  const [selectedCycle, setSelectedCycle] = useState<ProBillingCycle>(DEFAULT_PRO_OFFER);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Live packages by cycle (null until offerings load / when SDK absent).
  const packages = useMemo<Record<ProBillingCycle, PurchasesPackage | null>>(
    () => ({
      annual: offering?.annual ?? null,
      monthly: offering?.monthly ?? null,
    }),
    [offering]
  );

  // Prefer the store-localized price from the live package; fall back to the i18n
  // placeholder so the row still renders before offerings resolve.
  const offers = useMemo<PaywallOffer[]>(
    () => [
      {
        cycle: 'annual',
        label: translate('paywall.plans.annual.label'),
        price: packages.annual?.product.priceString ?? translate('paywall.plans.annual.price'),
        period: translate('paywall.plans.annual.period'),
        caption: translate('paywall.plans.annual.caption'),
        badge: translate('paywall.plans.annual.badge'),
      },
      {
        cycle: 'monthly',
        label: translate('paywall.plans.monthly.label'),
        price: packages.monthly?.product.priceString ?? translate('paywall.plans.monthly.price'),
        period: translate('paywall.plans.monthly.period'),
        caption: translate('paywall.plans.monthly.caption'),
      },
    ],
    [translate, packages]
  );

  const features = useMemo(
    () => [
      translate('paywall.features.highlights'),
      translate('paywall.features.notes'),
      translate('paywall.features.plans'),
      translate('paywall.features.translations'),
      translate('paywall.features.ai'),
      translate('paywall.features.sync'),
    ],
    [translate]
  );

  const selectedOffer = offers.find((o) => o.cycle === selectedCycle) ?? offers[0];
  const ctaLabel = translate('paywall.cta', {
    price: selectedOffer.price,
    period: selectedOffer.period,
  });

  const handleClose = useCallback(() => router.back(), [router]);

  const handleSubscribe = useCallback(async () => {
    if (isPurchasing) return;
    const pkg = packages[selectedCycle];
    // No live package (SDK not configured / offerings unset) — nothing to buy yet.
    if (!pkg) {
      Toast.show({ type: 'error', text1: translate('paywall.purchaseError') });
      return;
    }
    setIsPurchasing(true);
    try {
      const customerInfo = await purchasePackage(pkg);
      // Push the fresh entitlement into the cache so useIsPro flips immediately.
      queryClient.setQueryData(revenueCatKeys.customerInfo, customerInfo);
      if (isProActive(customerInfo)) {
        Toast.show({ type: 'success', text1: translate('paywall.purchaseSuccess') });
        router.back();
      }
    } catch (e) {
      // A user-cancelled purchase isn't an error worth surfacing.
      if (!isUserCancelledError(e)) {
        Toast.show({ type: 'error', text1: translate('paywall.purchaseError') });
      }
    } finally {
      setIsPurchasing(false);
    }
  }, [isPurchasing, packages, selectedCycle, queryClient, router, translate]);

  const handleRestore = useCallback(async () => {
    if (isPurchasing) return;
    setIsPurchasing(true);
    try {
      const customerInfo = await restorePurchases();
      queryClient.setQueryData(revenueCatKeys.customerInfo, customerInfo);
      if (isProActive(customerInfo)) {
        Toast.show({ type: 'success', text1: translate('paywall.restoreSuccess') });
        router.back();
      } else {
        Toast.show({ type: 'info', text1: translate('paywall.restoreNone') });
      }
    } catch {
      Toast.show({ type: 'error', text1: translate('paywall.purchaseError') });
    } finally {
      setIsPurchasing(false);
    }
  }, [isPurchasing, queryClient, router, translate]);

  const handleTerms = useCallback(() => {
    Linking.openURL(TERMS_URL);
  }, []);

  const handlePrivacy = useCallback(() => {
    Linking.openURL(PRIVACY_URL);
  }, []);

  return {
    translate,
    offers,
    features,
    selectedCycle,
    setSelectedCycle,
    ctaLabel,
    isPurchasing,
    handleClose,
    handleSubscribe,
    handleRestore,
    handleTerms,
    handlePrivacy,
  };
}
