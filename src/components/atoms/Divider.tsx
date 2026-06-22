import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, TextVariants } from './Text';

type DividerProps = {
  label?: string;
};

export function Divider({ label }: DividerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      {label && (
        <Text variant={TextVariants.Overline} color="textSecondary" style={styles.label}>
          {label}
        </Text>
      )}
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.semantic.bgTertiary,
  },
  label: {
    paddingHorizontal: theme.spacing[1],
  },
}));
