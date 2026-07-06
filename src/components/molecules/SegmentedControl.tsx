import { useState } from 'react';
import { LayoutChangeEvent, Pressable, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text, TEXT_VARIANTS } from '@/components/atoms';

const AnimatedText = Animated.createAnimatedComponent(Text);

export type Segment<T extends string> = {
  key: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  segments: Segment<T>[];
  value: T;
  onChange: (key: T) => void;
};

const SLIDE_DURATION = 250;

/**
 * A themed pill-row segmented control with an animated sliding thumb. Generic
 * over the segment key type, so the caller gets a typed `onChange`. Reusable
 * (first used to filter the Study tab).
 */
export function SegmentedControl<T extends string>({ segments, value, onChange }: SegmentedControlProps<T>) {
  const { theme } = useUnistyles();
  const [trackWidth, setTrackWidth] = useState(0);

  const count = segments.length;
  const activeIndex = Math.max(
    0,
    segments.findIndex((s) => s.key === value)
  );

  // Resolve gap to a plain number on the JS thread — `theme.gap` is a non-worklet
  // function and can't be called inside the `useAnimatedStyle` worklet (UI thread).
  const gap = theme.gap(1);

  // Inner width available to the segments (track padding on both sides).
  const innerWidth = Math.max(0, trackWidth - theme.spacing[1] * 2);
  // gap accumulates between segments, so each segment is (inner - totalGap) / count.
  const totalGap = gap * Math.max(0, count - 1);
  const segmentWidth = count > 0 ? (innerWidth - totalGap) / count : 0;

  // Animated progress toward the active index (fractional during the slide).
  const progress = useDerivedValue(() => withTiming(activeIndex, { duration: SLIDE_DURATION }), [activeIndex]);

  const thumbStyle = useAnimatedStyle(() => ({
    width: segmentWidth,
    transform: [{ translateX: progress.value * (segmentWidth + gap) }],
  }));

  const onTrackLayout = (e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width);

  return (
    <View style={styles.track} onLayout={onTrackLayout}>
      {/* Sliding thumb sits behind the labels and animates to the active segment. */}
      {segmentWidth > 0 && <Animated.View style={[styles.thumb, thumbStyle]} pointerEvents="none" />}

      {segments.map((segment, index) => (
        <SegmentItem
          key={segment.key}
          segment={segment}
          index={index}
          progress={progress}
          activeIndex={activeIndex}
          onPress={() => onChange(segment.key)}
          activeColor={theme.colors.semantic.accent}
          inactiveColor={theme.colors.semantic.textSecondary}
        />
      ))}
    </View>
  );
}

type SegmentItemProps<T extends string> = {
  segment: Segment<T>;
  index: number;
  progress: { value: number };
  activeIndex: number;
  onPress: () => void;
  activeColor: string;
  inactiveColor: string;
};

function SegmentItem<T extends string>({
  segment,
  index,
  progress,
  activeIndex,
  onPress,
  activeColor,
  inactiveColor,
}: SegmentItemProps<T>) {
  // Fade label color in/out as the thumb passes under it.
  const animatedTextStyle = useAnimatedStyle(() => {
    const distance = Math.min(1, Math.abs(progress.value - index));
    return {
      color: interpolateColor(distance, [0, 1], [activeColor, inactiveColor]),
    };
  });

  // `activeIndex` (a plain number prop from the parent) drives the a11y state
  // instead of reading `progress.value` here — reading a shared value's `.value`
  // synchronously during render (JS thread, not a worklet) trips Reanimated's
  // strict-mode "reading value during render" warning, one per mounted segment.
  const active = activeIndex === index;

  return (
    <Pressable
      onPress={onPress}
      style={styles.segment}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <AnimatedText variant={TEXT_VARIANTS.Label} numberOfLines={1} style={animatedTextStyle}>
        {segment.label}
      </AnimatedText>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  track: {
    flexDirection: 'row',
    gap: theme.gap(1),
    backgroundColor: theme.colors.semantic.bgTertiary,
    borderRadius: theme.radius.full,
    paddingVertical: theme.spacing[2],
    position: 'relative',
  },
  thumb: {
    position: 'absolute',
    top: theme.spacing[1],
    left: theme.spacing[1],
    bottom: theme.spacing[1],
    backgroundColor: theme.colors.semantic.bgPrimary,
    borderRadius: theme.radius.full,
    ...theme.shadows.sm,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[2],
    borderRadius: theme.radius.full,
  },
}));
