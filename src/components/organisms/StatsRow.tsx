import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, TextVariants } from '@/components/atoms';

type Stat = {
  value: string | number;
  label: string;
};

type StatsRowProps = {
  stats: Stat[];
};

export function StatsRow({ stats }: StatsRowProps) {
  return (
    <View style={styles.row}>
      {stats.map((stat) => (
        <View key={stat.label} style={styles.card}>
          <Text variant={TextVariants.Title1}>{stat.value}</Text>
          <Text variant={TextVariants.Caption} color="textSecondary">
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    gap: theme.spacing[3],
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.semantic.bgSecondary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing[4],
    gap: theme.spacing[1],
  },
}));
