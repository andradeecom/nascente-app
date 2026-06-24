import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { ChevronRight, Lock } from 'lucide-react-native';
import { Text, TextVariants } from '@/components/atoms';

type Stat = {
  value: string | number;
  label: string;
};

type StatsRowProps = {
  stats: Stat[];
  /** Guest mode: hide values behind a lock and turn the row into a sign-in CTA. */
  locked?: boolean;
  caption?: string;
  onPress?: () => void;
};

export function StatsRow({ stats, locked = false, caption, onPress }: StatsRowProps) {
  const tiles = (
    <View style={styles.row}>
      {stats.map((stat) => (
        <View key={stat.label} style={styles.card}>
          {locked ? (
            <Lock size={20} color={styles.lockIcon.color} strokeWidth={2} />
          ) : (
            <Text variant={TextVariants.Title1}>{stat.value}</Text>
          )}
          <Text variant={TextVariants.Caption} color="textSecondary">
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );

  if (!locked) {
    return tiles;
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.locked, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      {tiles}
      {caption ? (
        <View style={styles.caption}>
          <Text variant={TextVariants.Label} color="accent">
            {caption}
          </Text>
          <ChevronRight size={16} color={styles.captionIcon.color} strokeWidth={2.5} />
        </View>
      ) : null}
    </Pressable>
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
  locked: {
    gap: theme.spacing[2],
  },
  pressed: {
    opacity: 0.7,
  },
  lockIcon: {
    color: theme.colors.semantic.textTertiary,
  },
  caption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[1],
  },
  captionIcon: {
    color: theme.colors.semantic.accent,
  },
}));
