import { useCallback, useMemo, useState } from 'react';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useTranslate } from '@/i18n';
import { DEFAULT_PRO_OFFER, type ProBillingCycle } from '@/types/subscription';
import type { PaywallOffer } from '@/components/organisms';

const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL || 'https://nascente.app/terms';
const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL || 'https://nascente.app/privacy';

export default function usePaywallScreen() {
  const translate = useTranslate();
  const router = useRouter();

  const [selectedCycle, setSelectedCycle] = useState<ProBillingCycle>(DEFAULT_PRO_OFFER);

  // Literal keys per offer — TxKeyPath is a literal union, so dynamic/templated
  // keys won't type-check (same constraint the plans screens work around).
  const offers = useMemo<PaywallOffer[]>(
    () => [
      {
        cycle: 'annual',
        label: translate('paywall.plans.annual.label'),
        price: translate('paywall.plans.annual.price'),
        period: translate('paywall.plans.annual.period'),
        caption: translate('paywall.plans.annual.caption'),
        badge: translate('paywall.plans.annual.badge'),
      },
      {
        cycle: 'monthly',
        label: translate('paywall.plans.monthly.label'),
        price: translate('paywall.plans.monthly.price'),
        period: translate('paywall.plans.monthly.period'),
        caption: translate('paywall.plans.monthly.caption'),
      },
    ],
    [translate]
  );

  const features = useMemo(
    () => [
      translate('paywall.features.highlights'),
      translate('paywall.features.notes'),
      translate('paywall.features.plans'),
      translate('paywall.features.translations'),
      translate('paywall.features.audio'),
      translate('paywall.features.crossReferences'),
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

  // TODO(RevenueCat): kick off the actual purchase for `selectedCycle`'s package
  // (PRO_OFFERS[].packageId). Until billing exists, acknowledge + dismiss.
  const handleSubscribe = useCallback(() => {
    Toast.show({ type: 'info', text1: translate('paywall.finePrint') });
    router.back();
  }, [router, translate]);

  const handleRestore = useCallback(() => {
    Toast.show({ type: 'info', text1: translate('paywall.finePrint') });
  }, [translate]);

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
    handleClose,
    handleSubscribe,
    handleRestore,
    handleTerms,
    handlePrivacy,
  };
}
