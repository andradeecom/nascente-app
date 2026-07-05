import { Button, SafeAreaView, TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { LanguageOption, OnboardingStepHeader } from '@/components/molecules';
import { useTranslate } from '@/i18n';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import useOnboardingScreen from './use-onboarding-screen';
import { BUTTON_SIZES } from '@/components/atoms/Button';

export default function OnboardingLanguageScreen() {
  const { selected, languages, handleSelect, handleStart } = useOnboardingScreen();
  const t = useTranslate();

  return (
    <SafeAreaView style={styles.safe}>
      <OnboardingStepHeader step={1} total={4} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant={TEXT_VARIANTS.Title2}>{t('onboarding.language.title')}</Text>
          <Text variant={TEXT_VARIANTS.Callout} color={TEXT_COLORS.TextSecondary} style={styles.subtitle}>
            {t('onboarding.language.subtitle')}
          </Text>
          <Text variant={TEXT_VARIANTS.Callout} color={TEXT_COLORS.TextSecondary} style={styles.description}>
            {t('onboarding.language.description')}
          </Text>
        </View>

        <View style={styles.options}>
          {languages.map((locale) => (
            <LanguageOption
              key={locale}
              code={locale}
              name={t(`onboarding.language.options.${locale}.name`)}
              region={t(`onboarding.language.options.${locale}.region`)}
              selected={selected === locale}
              onSelect={() => handleSelect(locale)}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          label={t('onboarding.language.startButton')}
          size={BUTTON_SIZES.Large}
          fullWidth
          onPress={handleStart}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.semantic.bgPrimary,
  },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[8],
  },
  header: {
    gap: theme.spacing[2],
    marginBottom: theme.spacing[8],
  },
  subtitle: {
    marginTop: theme.spacing[0.5],
  },
  description: {
    marginTop: theme.spacing[3],
  },
  options: {
    gap: theme.spacing[3],
  },
  footer: {
    paddingHorizontal: theme.spacing[5],
    paddingBottom: theme.spacing[6],
    paddingTop: theme.spacing[4],
  },
}));
