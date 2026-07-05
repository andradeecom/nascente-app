import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { Card } from '../molecules';

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
        <Card key={stat.label} style={[styles.card, stat.muted && styles.cardMuted]}>
          <Text variant={TEXT_VARIANTS.Title1} color={stat.muted ? TEXT_COLORS.TextTertiary : TEXT_COLORS.TextPrimary}>
            {stat.value}
          </Text>
          <Text variant={TEXT_VARIANTS.Caption} color={TEXT_COLORS.TextSecondary}>
            {stat.label}
          </Text>
        </Card>
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
    backgroundColor: theme.colors.semantic.bgPrimary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing[4],
    gap: theme.spacing[1],
    alignItems: 'center',
  },
  cardMuted: {
    opacity: 0.6,
  },
}));
