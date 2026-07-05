import { View } from 'react-native';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { Check } from 'lucide-react-native';
import { SafeAreaView, Text, TEXT_VARIANTS } from '@/components/atoms';
import { SettingsRow } from '@/components/molecules';
import { SettingsList, ScreenHeader } from '@/components/organisms';
import { useReaderStore, type ReaderFontSize } from '@/stores/reader';
import { useTranslate } from '@/i18n';
import { typography } from '@/theme/typography';

const ThemedCheck = withUnistyles(Check, (theme) => ({ color: theme.colors.semantic.accent }));

const FONT_SIZE_OPTIONS: ReaderFontSize[] = ['small', 'medium', 'large', 'xl'];

export default function TextSizeScreen() {
  const translate = useTranslate();
  const fontSize = useReaderStore((s) => s.fontSize);
  const setFontSize = useReaderStore((s) => s.setFontSize);

  const currentSize = typography.reader.sizes[fontSize];
  const currentLineHeight = currentSize * typography.reader.lineHeightMultipliers[fontSize];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={translate('settings.textSizeTitle')} />
      <View style={styles.container}>
        <View style={styles.preview}>
          <Text
            variant={TEXT_VARIANTS.Body}
            style={{
              fontFamily: typography.reader.families.serif,
              fontSize: currentSize,
              lineHeight: currentLineHeight,
            }}
          >
            {translate('settings.textSizePreview')}
          </Text>
          <Text variant={TEXT_VARIANTS.Caption} color="textSecondary" style={styles.previewLabel}>
            {currentSize} pt
          </Text>
        </View>

        <SettingsList>
          {FONT_SIZE_OPTIONS.map((option) => (
            <SettingsRow
              key={option}
              label={translate(`settings.textSizeOptions.${option}`)}
              value={`${typography.reader.sizes[option]} pt`}
              showChevron={false}
              icon={option === fontSize ? <ThemedCheck size={20} /> : undefined}
              onPress={() => setFontSize(option)}
            />
          ))}
        </SettingsList>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.semantic.bgSecondary,
  },
  container: {
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[6],
    gap: theme.spacing[6],
  },
  preview: {
    backgroundColor: theme.colors.semantic.bgPrimary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing[5],
    gap: theme.spacing[3],
  },
  previewLabel: {
    textAlign: 'right',
  },
}));
