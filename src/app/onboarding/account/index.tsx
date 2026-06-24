import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { CloudCheck, Check } from 'lucide-react-native';
import { Button, Text, TextVariants, SafeAreaView } from '@/components/atoms';
import { OnboardingStepHeader } from '@/components/molecules';
import { useTranslate } from '@/i18n';
import { typography } from '@/theme/typography';
import useOnboardingAccountScreen from './use-onboarding-account-screen';

const BENEFITS = ['highlights', 'plans', 'backup'] as const;

export default function OnboardingAccountScreen() {
  const { handleCreateAccount, handleSkip, handleBack } = useOnboardingAccountScreen();
  const t = useTranslate();

  return (
    <SafeAreaView style={styles.safe}>
      <OnboardingStepHeader step={4} total={4} onBack={handleBack} />

      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={styles.iconBadge}>
            <CloudCheck size={40} color={styles.heroIcon.color} strokeWidth={2} />
          </View>
          <Text variant={TextVariants.Title1} style={styles.title}>
            {t('onboarding.account.title')}
          </Text>
          <Text variant={TextVariants.Callout} color="textSecondary" style={styles.subtitle}>
            {t('onboarding.account.subtitle')}
          </Text>
        </View>

        <View style={styles.benefits}>
          {BENEFITS.map((key) => (
            <View key={key} style={styles.benefitRow}>
              <View style={styles.benefitIcon}>
                <Check size={16} color={styles.benefitIconColor.color} strokeWidth={3} />
              </View>
              <Text variant={TextVariants.Body} style={styles.benefitText}>
                {t(`onboarding.account.benefits.${key}`)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Button label={t('onboarding.account.createButton')} size="lg" fullWidth onPress={handleCreateAccount} />
        <Button label={t('onboarding.account.skipButton')} variant="ghost" size="lg" fullWidth onPress={handleSkip} />
        <Text variant={TextVariants.Caption} color="textTertiary" style={styles.footerNote}>
          {t('onboarding.account.footer')}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.semantic.bgPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[6],
  },
  hero: {
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  iconBadge: {
    width: 96,
    height: 96,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.semantic.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[2],
  },
  heroIcon: {
    color: theme.colors.semantic.accent,
  },
  title: {
    textAlign: 'center',
    fontFamily: typography.reader.families.serif,
  },
  subtitle: {
    textAlign: 'center',
  },
  benefits: {
    marginTop: theme.spacing[8],
    gap: theme.spacing[4],
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  benefitIcon: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.semantic.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitIconColor: {
    color: theme.colors.semantic.accent,
  },
  benefitText: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: theme.spacing[5],
    paddingBottom: theme.spacing[6],
    paddingTop: theme.spacing[4],
    gap: theme.spacing[2],
  },
  footerNote: {
    textAlign: 'center',
    marginTop: theme.spacing[1],
  },
}));
