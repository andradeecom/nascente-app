import { Linking, ScrollView, View } from 'react-native';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { PressableScale } from 'pressto';
import { ExternalLink } from 'lucide-react-native';
import { SafeAreaView, TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { ScreenHeader } from '@/components/organisms';
import { TRANSLATION_CREDITS } from '@/types/bible';
import { useTranslate } from '@/i18n';

const ThemedExternalLink = withUnistyles(ExternalLink, (theme) => ({ color: theme.colors.semantic.accent }));

/**
 * Credits / attribution screen. Lists every bundled translation with its license
 * + source. Required because some bundled translations are CC-BY / CC-BY-SA,
 * which obligate attribution. Data-driven by `TRANSLATION_CREDITS` so enabling a
 * new translation automatically surfaces (and credits) it here.
 */
export default function CreditsScreen() {
  const translate = useTranslate();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={translate('settings.credits.title')} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text variant={TEXT_VARIANTS.Callout} color={TEXT_COLORS.TextSecondary} style={styles.intro}>
          {translate('settings.credits.intro')}
        </Text>

        {TRANSLATION_CREDITS.map((credit) => (
          <View key={credit.id} style={styles.card}>
            <Text variant={TEXT_VARIANTS.BodyEmphasis}>{credit.title}</Text>
            <Text variant={TEXT_VARIANTS.Caption} color={TEXT_COLORS.TextSecondary} style={styles.license}>
              {credit.license}
            </Text>
            {credit.copyright && (
              <Text variant={TEXT_VARIANTS.Caption} color={TEXT_COLORS.TextTertiary}>
                {credit.copyright}
              </Text>
            )}
            <PressableScale
              style={styles.linkRow}
              onPress={() => Linking.openURL(credit.licenseUrl ?? credit.sourceUrl)}
            >
              <Text variant={TEXT_VARIANTS.Caption} color={TEXT_COLORS.Accent}>
                {translate('settings.credits.viewLicense')}
              </Text>
              <ThemedExternalLink size={13} />
            </PressableScale>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.semantic.bgSecondary,
  },
  scroll: {
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[6],
    gap: theme.spacing[3],
  },
  intro: {
    marginBottom: theme.spacing[2],
  },
  card: {
    padding: theme.spacing[4],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.semantic.bgPrimary,
    borderWidth: 1,
    borderColor: theme.colors.semantic.bgTertiary,
    gap: theme.spacing[1],
  },
  license: {
    marginBottom: theme.spacing[0.5],
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
    marginTop: theme.spacing[2],
  },
}));
