import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { SafeAreaView, TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { FontSizeSlider } from '@/components/molecules';
import { ScreenHeader } from '@/components/organisms';
import { FONT_SIZE_OPTIONS, useReaderStore } from '@/stores/reader';
import { useTranslate } from '@/i18n';
import { typography } from '@/theme/typography';

export default function TextSizeScreen() {
  const translate = useTranslate();
  const fontSize = useReaderStore((s) => s.fontSize);
  const setFontSize = useReaderStore((s) => s.setFontSize);

  const currentSize = typography.reader.sizes[fontSize];
  const currentLineHeight = currentSize * typography.reader.lineHeightMultipliers[fontSize];
  const fontSizeIndex = Math.max(0, FONT_SIZE_OPTIONS.indexOf(fontSize));

  const handleChange = (index: number) => {
    const next = FONT_SIZE_OPTIONS[index];
    if (next) setFontSize(next);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={translate('settings.textSizeTitle')} />
      <View style={styles.container}>
        <FontSizeSlider
          label={translate('settings.textSize')}
          valueLabel={translate(`settings.textSizeOptions.${fontSize}`)}
          hint={`${currentSize} pt`}
          steps={FONT_SIZE_OPTIONS.length}
          value={fontSizeIndex}
          onChange={handleChange}
        />

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
          <Text variant={TEXT_VARIANTS.Caption} color={TEXT_COLORS.TextSecondary} style={styles.previewLabel}>
            {currentSize} pt
          </Text>
        </View>
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
