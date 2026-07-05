import { View } from 'react-native';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { CloudCheck, Check } from 'lucide-react-native';
import { Button, SafeAreaView, TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { OnboardingStepHeader } from '@/components/molecules';
import { useTranslate } from '@/i18n';
import { typography } from '@/theme/typography';
import useOnboardingAccountScreen from './use-onboarding-account-screen';
import { BUTTON_SIZES, BUTTON_VARIANTS } from '@/components/atoms/Button';

const ThemedCloudCheck = withUnistyles(CloudCheck, (theme) => ({ color: theme.colors.semantic.accent }));
const ThemedCheck = withUnistyles(Check, (theme) => ({ color: theme.colors.semantic.accent }));

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
            <ThemedCloudCheck size={40} strokeWidth={2} />
          </View>
          <Text variant={TEXT_VARIANTS.Title1} style={styles.title}>
            {t('onboarding.account.title')}
          </Text>
          <Text variant={TEXT_VARIANTS.Callout} color={TEXT_COLORS.TextSecondary} style={styles.subtitle}>
            {t('onboarding.account.subtitle')}
          </Text>
        </View>

        <View style={styles.benefits}>
          {BENEFITS.map((key) => (
            <View key={key} style={styles.benefitRow}>
              <View style={styles.benefitIcon}>
                <ThemedCheck size={16} strokeWidth={3} />
              </View>
              <Text variant={TEXT_VARIANTS.Body} style={styles.benefitText}>
                {t(`onboarding.account.benefits.${key}`)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          label={t('onboarding.account.createButton')}
          size={BUTTON_SIZES.Large}
          fullWidth
          onPress={handleCreateAccount}
        />
        <Button
          label={t('onboarding.account.skipButton')}
          variant={BUTTON_VARIANTS.Ghost}
          size={BUTTON_SIZES.Large}
          fullWidth
          onPress={handleSkip}
        />
        <Text variant={TEXT_VARIANTS.Caption} color={TEXT_COLORS.TextTertiary} style={styles.footerNote}>
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
