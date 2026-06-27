import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, TEXT_VARIANTS } from '@/components/atoms';

export type Segment<T extends string> = {
  key: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  segments: Segment<T>[];
  value: T;
  onChange: (key: T) => void;
};

/**
 * A themed pill-row segmented control. Generic over the segment key type, so the
 * caller gets a typed `onChange`. Reusable (first used to filter the Study tab).
 */
export function SegmentedControl<T extends string>({ segments, value, onChange }: SegmentedControlProps<T>) {
  return (
    <View style={styles.track}>
      {segments.map((segment) => {
        const active = segment.key === value;
        return (
          <Pressable
            key={segment.key}
            onPress={() => onChange(segment.key)}
            style={[styles.segment, active && styles.segmentActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text variant={TEXT_VARIANTS.Label} color={active ? 'accent' : 'textSecondary'} numberOfLines={1}>
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  track: {
    flexDirection: 'row',
    gap: theme.spacing[1],
    backgroundColor: theme.colors.semantic.bgTertiary,
    borderRadius: theme.radius.full,
    padding: theme.spacing[1],
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[2],
    borderRadius: theme.radius.full,
  },
  segmentActive: {
    backgroundColor: theme.colors.semantic.bgPrimary,
    ...theme.shadows.sm,
  },
}));
