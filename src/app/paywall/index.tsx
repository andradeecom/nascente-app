import { StyleSheet } from 'react-native-unistyles';
import { SafeAreaView } from '@/components/atoms';
import { Paywall } from '@/components/organisms';
import usePaywallScreen from './use-paywall-screen';

export default function PaywallScreen() {
  const {
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
  } = usePaywallScreen();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Paywall
        overline={translate('paywall.overline')}
        title={translate('paywall.title')}
        subtitle={translate('paywall.subtitle')}
        offers={offers}
        selectedCycle={selectedCycle}
        onSelectCycle={setSelectedCycle}
        featuresTitle={translate('paywall.featuresTitle')}
        features={features}
        ctaLabel={ctaLabel}
        finePrint={translate('paywall.finePrint')}
        restoreLabel={translate('paywall.restore')}
        termsLabel={translate('paywall.terms')}
        privacyLabel={translate('paywall.privacy')}
        closeLabel={translate('common.close')}
        onSubscribe={handleSubscribe}
        onRestore={handleRestore}
        onTerms={handleTerms}
        onPrivacy={handlePrivacy}
        onClose={handleClose}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.semantic.accent,
  },
}));
