import { ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button, Text, TEXT_VARIANTS, SafeAreaView } from '@/components/atoms';
import { TranslationOption, OnboardingStepHeader } from '@/components/molecules';
import { useTranslate } from '@/i18n';
import useOnboardingTranslationScreen from './use-onboarding-translation-screen';
import { BUTTON_SIZES } from '@/components/atoms/Button';

export default function OnboardingTranslationScreen() {
  const { sections, selectedKey, selectedName, handleSelect, handleContinue, handleBack } =
    useOnboardingTranslationScreen();
  const t = useTranslate();

  return (
    <SafeAreaView style={styles.safe}>
      <OnboardingStepHeader step={2} total={4} onBack={handleBack} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant={TEXT_VARIANTS.Title2}>{t('onboarding.translation.title')}</Text>
          <Text variant={TEXT_VARIANTS.Callout} color="textSecondary" style={styles.subtitle}>
            {t('onboarding.translation.subtitle')}
          </Text>
        </View>

        {sections.map((section) => (
          <View key={section.sectionKey} style={styles.section}>
            <Text variant={TEXT_VARIANTS.Overline} color="textTertiary">
              {t(`onboarding.translation.sections.${section.sectionKey}.label`)}
            </Text>
            <Text variant={TEXT_VARIANTS.Caption} color="textSecondary" style={styles.sectionCaption}>
              {t(`onboarding.translation.sections.${section.sectionKey}.caption`)}
            </Text>

            <View style={styles.options}>
              {section.items.map((item) => (
                <TranslationOption
                  key={item.key}
                  title={item.title}
                  description={item.description}
                  size={item.size}
                  tier={item.tier}
                  offlineLabel={t('onboarding.translation.offlineBadge')}
                  proLabel={t('onboarding.translation.proBadge')}
                  selected={selectedKey === item.key}
                  onSelect={() => handleSelect(item.key)}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Text variant={TEXT_VARIANTS.Caption} color="textTertiary" style={styles.footerNote}>
          {t('onboarding.translation.footer', { name: selectedName })}
        </Text>
        <Button
          label={t('onboarding.translation.continueButton')}
          size={BUTTON_SIZES.Large}
          fullWidth
          onPress={handleContinue}
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
  sectionCaption: {
    marginTop: theme.spacing[0.5],
    marginBottom: theme.spacing[3],
  },
  options: {
    gap: theme.spacing[3],
  },
  footer: {
    paddingHorizontal: theme.spacing[5],
    paddingBottom: theme.spacing[6],
    paddingTop: theme.spacing[4],
    borderTopWidth: 1,
    borderTopColor: theme.colors.semantic.bgTertiary,
    gap: theme.spacing[3],
  },
  footerNote: {
    textAlign: 'center',
  },
}));
