import { ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button, Text, TEXT_VARIANTS, SafeAreaView } from '@/components/atoms';
import { OnboardingStepHeader, ThemePreviewCard, FontSizeSlider, ReaderPreviewCard } from '@/components/molecules';
import { useTranslate } from '@/i18n';
import useOnboardingPreferencesScreen from './use-onboarding-preferences-screen';
import { BUTTON_SIZES } from '@/components/atoms/Button';

export default function OnboardingPreferencesScreen() {
  const {
    theme,
    themeOptions,
    fontSizeIndex,
    fontSizeSteps,
    fontSizePt,
    fontLineHeight,
    handleSelectTheme,
    handleSelectFontSize,
    handleFinish,
    handleBack,
  } = useOnboardingPreferencesScreen();
  const t = useTranslate();

  return (
    <SafeAreaView style={styles.safe}>
      <OnboardingStepHeader step={3} total={4} onBack={handleBack} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant={TEXT_VARIANTS.Title2}>{t('onboarding.preferences.title')}</Text>
          <Text variant={TEXT_VARIANTS.Callout} color="textSecondary" style={styles.subtitle}>
            {t('onboarding.preferences.subtitle')}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text variant={TEXT_VARIANTS.Overline} color="textTertiary">
              {t('onboarding.preferences.themeLabel')}
            </Text>
            <Text variant={TEXT_VARIANTS.Caption} color="textTertiary">
              {t('onboarding.preferences.themeHint')}
            </Text>
          </View>

          <View style={styles.themeRow}>
            {themeOptions.map((option) => (
              <ThemePreviewCard
                key={option}
                name={option}
                label={t(`settings.themeOptions.${option}`)}
                selected={theme === option}
                onSelect={() => handleSelectTheme(option)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <FontSizeSlider
            label={t('onboarding.preferences.textSizeLabel')}
            valueLabel={`${fontSizePt} pt`}
            hint={t('onboarding.preferences.textSizeHint')}
            steps={fontSizeSteps}
            value={fontSizeIndex}
            onChange={handleSelectFontSize}
          />
        </View>

        <ReaderPreviewCard
          reference={t('onboarding.preferences.previewReference')}
          previewText={t('settings.textSizePreview')}
          fontSize={fontSizePt}
          lineHeight={fontLineHeight}
        />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={t('onboarding.preferences.finishButton')}
          size={BUTTON_SIZES.Large}
          fullWidth
          onPress={handleFinish}
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
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[4],
    paddingBottom: theme.spacing[6],
  },
  header: {
    gap: theme.spacing[2],
    marginBottom: theme.spacing[6],
  },
  subtitle: {
    marginTop: theme.spacing[0.5],
  },
  section: {
    marginBottom: theme.spacing[6],
  },
  sectionHeading: {
    gap: theme.spacing[0.5],
    marginBottom: theme.spacing[3],
  },
  themeRow: {
    flexDirection: 'row',
    gap: theme.spacing[3],
  },
  footer: {
    paddingHorizontal: theme.spacing[5],
    paddingBottom: theme.spacing[6],
    paddingTop: theme.spacing[4],
    borderTopWidth: 1,
    borderTopColor: theme.colors.semantic.bgTertiary,
  },
}));
