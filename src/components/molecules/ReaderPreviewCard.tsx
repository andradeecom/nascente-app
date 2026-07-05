import { View } from 'react-native';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { typography } from '@/theme/typography';

const ThemedView = withUnistyles(View);

type ReaderPreviewCardProps = {
  reference: string;
  previewText: string;
  fontSize: number;
  lineHeight: number;
};

export function ReaderPreviewCard({ reference, previewText, fontSize, lineHeight }: ReaderPreviewCardProps) {
  return (
    <ThemedView style={styles.container}>
      <Text variant={TEXT_VARIANTS.Overline} color={TEXT_COLORS.TextTertiary}>
        {reference}
      </Text>
      <Text style={[styles.text, { fontFamily: typography.reader.families.serif, fontSize, lineHeight }]}>
        <Text style={styles.verseNumber}>1 </Text>
        {previewText}
      </Text>
    </ThemedView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    borderWidth: 1,
    borderColor: theme.colors.semantic.bgTertiary,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.semantic.bgPrimary,
    padding: theme.spacing[4],
    gap: theme.spacing[2],
  },
  text: {
    color: theme.colors.semantic.textPrimary,
  },
  verseNumber: {
    color: theme.colors.semantic.accent,
    fontWeight: theme.font.weights.semibold,
  },
}));
