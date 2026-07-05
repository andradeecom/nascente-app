import { StyleSheet } from 'react-native-unistyles';
import { TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';

type SectionHeaderProps = {
  title: string;
};

/** Uppercase overline label that introduces a list section (e.g. "PLANOS ATIVOS"). */
export function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <Text variant={TEXT_VARIANTS.Overline} color={TEXT_COLORS.TextSecondary} style={styles.title}>
      {title}
    </Text>
  );
}

const styles = StyleSheet.create((theme) => ({
  title: {
    marginBottom: theme.spacing[3],
    textTransform: 'uppercase',
  },
}));
