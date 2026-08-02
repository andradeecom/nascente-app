import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import type { PurchasesPackage } from 'react-native-purchases';
import { useTranslate } from '@/i18n';
import { useProOfferings, revenueCatKeys } from '@/hooks/use-revenuecat';
import { isProActive, isUserCancelledError, purchasePackage, restorePurchases } from '@/lib/revenuecat';
import { capture } from '@/lib/posthog';
import { useAuthStore } from '@/stores/auth';
import { DEFAULT_PRO_OFFER, type ProBillingCycle } from '@/types/subscription';
import type { PaywallOffer } from '@/components/organisms';

const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL || 'https://nascente.app/terms';
const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL || 'https://nascente.app/privacy';

/** Formats an annual product's monthly-equivalent price in its own store currency. */
function formatMonthlyEquivalent(annualPrice: number, currencyCode: string): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode }).format(annualPrice / 12);
}

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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

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
        // The i18n caption is a fixed USD placeholder — real store prices vary by
        // country/currency, so derive the monthly-equivalent from the live package
        // once offerings load; only fall back to the placeholder before that.
        caption: packages.annual
          ? translate('paywall.plans.annual.captionEquivalent', {
              price: formatMonthlyEquivalent(packages.annual.product.price, packages.annual.product.currencyCode),
            })
          : translate('paywall.plans.annual.caption'),
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
      translate('paywall.features.ai'),
      translate('paywall.features.plans'),
      translate('paywall.features.translations'),
      translate('paywall.features.sync'),
      translate('paywall.features.highlights'),
      translate('paywall.features.notes'),
    ],
    [translate]
  );

  const selectedOffer = offers.find((o) => o.cycle === selectedCycle) ?? offers[0];
  const ctaLabel = translate('paywall.cta', {
    price: selectedOffer.price,
    period: selectedOffer.period,
  });

  // The paywall is a modal reached only from a Pro gate, so mount == viewed.
  // Pairs with `pro_gate_hit` (fired in `useProGate`) to give gate → paywall reach.
  useEffect(() => {
    capture('paywall_viewed');
  }, []);

  // Wraps the raw setter so the choice is captured without changing the screen's
  // public shape (`index.tsx` still passes this straight to `onSelectCycle`).
  const handleSelectCycle = useCallback((cycle: ProBillingCycle) => {
    setSelectedCycle(cycle);
    capture('paywall_plan_selected', { cycle });
  }, []);

  const handleClose = useCallback(() => router.back(), [router]);

  const handleSubscribe = useCallback(async () => {
    if (isPurchasing) return;
    // Correctness backstop, not UX: every Pro gate routes guests to /register
    // via `useProGate`, so this screen should only ever be reached signed in.
    // A guest purchase would bind to an anonymous RevenueCat id with no
    // `profiles` row for the webhook to grant against — and would be lost on
    // reinstall/device-switch — so refuse rather than take their money.
    if (!isAuthenticated) {
      router.replace('/register');
      return;
    }
    const pkg = packages[selectedCycle];
    // No live package (SDK not configured / offerings unset) — nothing to buy yet.
    if (!pkg) {
      Toast.show({ type: 'error', text1: translate('paywall.purchaseError') });
      return;
    }
    setIsPurchasing(true);
    capture('purchase_started', {
      cycle: selectedCycle,
      price: pkg.product.price,
      currency: pkg.product.currencyCode,
    });
    try {
      const customerInfo = await purchasePackage(pkg);
      // Push the fresh entitlement into the cache so useIsPro flips immediately.
      queryClient.setQueryData(revenueCatKeys.customerInfo, customerInfo);
      if (isProActive(customerInfo)) {
        capture('purchase_completed', {
          cycle: selectedCycle,
          price: pkg.product.price,
          currency: pkg.product.currencyCode,
        });
        Toast.show({ type: 'success', text1: translate('paywall.purchaseSuccess') });
        router.back();
      }
    } catch (e) {
      // A user-cancelled purchase isn't an error worth surfacing to the user —
      // but it IS worth capturing: store-sheet abandonment is a real funnel step
      // that was previously invisible, and it's distinct from a failed purchase.
      if (isUserCancelledError(e)) {
        capture('purchase_cancelled', { cycle: selectedCycle });
      } else {
        capture('purchase_failed', {
          cycle: selectedCycle,
          reason: e instanceof Error ? e.message : 'unknown',
        });
        Toast.show({ type: 'error', text1: translate('paywall.purchaseError') });
      }
    } finally {
      setIsPurchasing(false);
    }
  }, [isPurchasing, isAuthenticated, packages, selectedCycle, queryClient, router, translate]);

  const handleRestore = useCallback(async () => {
    if (isPurchasing) return;
    setIsPurchasing(true);
    try {
      const customerInfo = await restorePurchases();
      queryClient.setQueryData(revenueCatKeys.customerInfo, customerInfo);
      const hadEntitlement = isProActive(customerInfo);
      capture('purchase_restored', { had_entitlement: hadEntitlement });
      if (hadEntitlement) {
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
    setSelectedCycle: handleSelectCycle,
    ctaLabel,
    isPurchasing,
    handleClose,
    handleSubscribe,
    handleRestore,
    handleTerms,
    handlePrivacy,
  };
}
