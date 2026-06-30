import { View } from 'react-native';
import { EaseView } from 'react-native-ease';
import { StyleSheet } from 'react-native-unistyles';
import { Text, TEXT_VARIANTS, SafeAreaView } from '@/components/atoms';
import { ShineButton } from '@/components/molecules';
import { AnimatedSun } from '@/components/organisms';
import { useTranslate } from '@/i18n';
import { typography } from '@/theme/typography';
import useOnboardingWelcomeScreen from './use-onboarding-welcome-screen';

const PULSE_DURATION = 2600;

export default function OnboardingWelcomeScreen() {
  const { handleStartReading } = useOnboardingWelcomeScreen();
  const t = useTranslate();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <AnimatedSun />

        <View style={styles.copy}>
          <Text variant={TEXT_VARIANTS.Overline} color="accent" style={styles.overline}>
            {t('onboarding.welcome.overline')}
          </Text>
          <Text variant={TEXT_VARIANTS.Display} style={styles.title}>
            {t('onboarding.welcome.title')}
          </Text>
          <Text style={styles.verse}>{t('onboarding.welcome.verse')}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <EaseView
          style={styles.glow}
          initialAnimate={{ shadowOpacity: 0.18, shadowRadius: 10 }}
          animate={{ shadowOpacity: 0.5, shadowRadius: 10 }}
          transition={{
            type: 'timing',
            duration: PULSE_DURATION,
            easing: [0.455, 0.03, 0.515, 0.955],
            loop: 'reverse',
          }}
        >
          <ShineButton label={t('onboarding.welcome.startButton')} onPress={handleStartReading} />
        </EaseView>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[6],
    gap: theme.spacing[10],
  },
  copy: {
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  overline: {
    textAlign: 'center',
  },
  title: {
    textAlign: 'center',
    fontFamily: typography.reader.families.serif,
  },
  verse: {
    textAlign: 'center',
    color: theme.colors.semantic.textSecondary,
    fontFamily: typography.reader.families.serif,
    fontStyle: 'italic',
    fontSize: theme.font.sizes.title3,
    lineHeight: theme.font.lineHeights.title2,
  },
  chevron: {
    color: theme.colors.semantic.accent,
  },
  footer: {
    paddingHorizontal: theme.spacing[5],
    paddingBottom: theme.spacing[6],
    paddingTop: theme.spacing[4],
    gap: theme.spacing[2],
  },
  glow: {
    borderRadius: theme.radius.lg,
    shadowColor: theme.colors.semantic.accent,
    shadowOffset: { width: 0, height: 8 },
  },
}));
