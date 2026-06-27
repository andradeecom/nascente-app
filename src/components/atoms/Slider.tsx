import { type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { clamp, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { StyleSheet } from 'react-native-unistyles';
import { useAnimatedTheme } from 'react-native-unistyles/reanimated';

type SliderProps = {
  /** Number of discrete steps the thumb can snap to. */
  steps: number;
  /** Current step index (0-based, controlled). */
  value: number;
  /** Called with the new step index as the thumb is dragged or tapped. */
  onChange: (index: number) => void;
};

const THUMB_SIZE = 26;
const SNAP_DURATION = 180;

/**
 * A reusable, draggable slider that snaps to a fixed number of discrete steps.
 * The thumb follows the finger on the UI thread (Reanimated) and reports the
 * nearest step via `onChange`. Tapping anywhere on the track jumps to that step.
 */
export function Slider({ steps, value, onChange }: SliderProps) {
  // Theme as a SharedValue so colors resolve on the UI thread. Reanimated's
  // Animated.View bypasses Unistyles' normal update path, so reading the theme
  // through useAnimatedTheme (instead of static styles) avoids the color flash
  // when the active theme changes while this component is mounted.
  const theme = useAnimatedTheme();
  const trackWidth = useSharedValue(0);
  const translateX = useSharedValue(0);
  const pressed = useSharedValue(0);
  const lastIndex = useSharedValue(value);

  const positionFor = (index: number, width: number) => {
    'worklet';
    const travel = Math.max(0, width - THUMB_SIZE);
    return steps > 1 ? (index / (steps - 1)) * travel : 0;
  };

  const report = (index: number) => {
    'worklet';
    if (index !== lastIndex.value) {
      lastIndex.value = index;
      // `runOnJS` is deprecated in favor of `scheduleOnRN` from
      // react-native-worklets; it schedules `onChange(index)` back on the JS thread.
      scheduleOnRN(onChange, index);
    }
  };

  const indexForPosition = (x: number, width: number) => {
    'worklet';
    const travel = Math.max(0, width - THUMB_SIZE);
    const ratio = travel > 0 ? x / travel : 0;
    return Math.round(ratio * (steps - 1));
  };

  const drag = (x: number) => {
    'worklet';
    const travel = Math.max(0, trackWidth.value - THUMB_SIZE);
    const next = clamp(x - THUMB_SIZE / 2, 0, travel);
    translateX.value = next;
    report(indexForPosition(next, trackWidth.value));
  };

  const settle = () => {
    'worklet';
    const index = indexForPosition(translateX.value, trackWidth.value);
    translateX.value = withTiming(positionFor(index, trackWidth.value), { duration: SNAP_DURATION });
    report(index);
  };

  const pan = Gesture.Pan()
    .onBegin((e) => {
      pressed.value = withTiming(1, { duration: 120 });
      drag(e.x);
    })
    .onUpdate((e) => drag(e.x))
    .onFinalize(() => {
      pressed.value = withTiming(0, { duration: 120 });
      settle();
    });

  const tap = Gesture.Tap().onEnd((e) => {
    const index = indexForPosition(clamp(e.x - THUMB_SIZE / 2, 0, trackWidth.value), trackWidth.value);
    translateX.value = withTiming(positionFor(index, trackWidth.value), { duration: SNAP_DURATION });
    report(index);
  });

  const gesture = Gesture.Race(pan, tap);

  const onLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    trackWidth.value = width;
    // Position the thumb without animating on the very first / resize layout.
    translateX.value = positionFor(value, width);
    lastIndex.value = value;
  };

  const railStyle = useAnimatedStyle(() => ({
    backgroundColor: theme.value.colors.semantic.bgTertiary,
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: translateX.value + THUMB_SIZE / 2,
    backgroundColor: theme.value.colors.semantic.accent,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: 1 + pressed.value * 0.18 }],
    backgroundColor: theme.value.colors.semantic.bgPrimary,
    borderColor: theme.value.colors.semantic.accent,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={styles.track} onLayout={onLayout} hitSlop={12}>
        <Animated.View style={[styles.rail, railStyle]} />
        <Animated.View style={[styles.fill, fillStyle]} />
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create((theme) => ({
  track: {
    flex: 1,
    height: THUMB_SIZE,
    justifyContent: 'center',
  },
  rail: {
    height: 4,
    borderRadius: theme.radius.full,
  },
  fill: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: theme.radius.full,
  },
  thumb: {
    position: 'absolute',
    left: 0,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: theme.radius.full,
    borderWidth: 2,
    ...theme.shadows.sm,
  },
}));
