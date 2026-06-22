import { StyleSheet } from 'react-native-unistyles';
import { Text, TextVariants } from '@/components/atoms';

type SectionHeaderProps = {
  title: string;
};

/** Uppercase overline label that introduces a list section (e.g. "PLANOS ATIVOS"). */
export function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <Text variant={TextVariants.Overline} color="textSecondary" style={styles.title}>
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
