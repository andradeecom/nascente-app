import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, TextVariants } from '@/components/atoms';

type Stat = {
  value: string | number;
  label: string;
  /** Dim the tile — used for a deferred/not-yet-tracked stat (e.g. Highlights). */
  muted?: boolean;
};

type StatsRowProps = {
  stats: Stat[];
};

export function StatsRow({ stats }: StatsRowProps) {
  return (
    <View style={styles.row}>
      {stats.map((stat) => (
        <View key={stat.label} style={[styles.card, stat.muted && styles.cardMuted]}>
          <Text variant={TextVariants.Title1} color={stat.muted ? 'textTertiary' : 'textPrimary'}>
            {stat.value}
          </Text>
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
    alignItems: 'center',
  },
  cardMuted: {
    opacity: 0.6,
  },
}));
