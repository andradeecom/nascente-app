import { useEffect, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { StyleSheet } from 'react-native-unistyles';
import { Button, BUTTON_SIZES } from '@/components/atoms/Button';

type ShineButtonProps = {
  label: string;
  onPress: () => void;
};

const SHINE_BAND = 120; // width of the moving highlight
const SHINE_SWEEP = 1100; // time for one left-to-right pass
const SHINE_GAP = 2600; // pause between passes so it never feels busy

/**
 * A Large primary Button with a soft diagonal highlight that sweeps from left
 * to right on a slow, paused loop. The sheen is a skewed SVG gradient clipped to
 * the button's rounded corners; `pointerEvents="none"` keeps presses working.
 */
export function ShineButton({ label, onPress }: ShineButtonProps) {
  const [box, setBox] = useState({ width: 0, height: 0 });
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withDelay(SHINE_GAP, withTiming(1, { duration: SHINE_SWEEP, easing: Easing.inOut(Easing.ease) })),
      -1,
      false
    );
    return () => cancelAnimation(progress);
  }, [progress]);

  const bandStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [-SHINE_BAND, box.width + SHINE_BAND]) },
      { skewX: '-18deg' },
    ],
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox({ width, height });
  };

  // Overscan the band vertically so the skewed edges still cover the corners.
  const bandHeight = box.height * 1.8;

  return (
    <View style={styles.shineClip} onLayout={onLayout}>
      <Button label={label} size={BUTTON_SIZES.Large} fullWidth onPress={onPress} />

      {box.width > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[shineBand, { height: bandHeight, top: -(bandHeight - box.height) / 2 }, bandStyle]}
        >
          <Svg width={SHINE_BAND} height={bandHeight}>
            <Defs>
              <LinearGradient id="btnShine" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#ffffff" stopOpacity={0} />
                <Stop offset="0.5" stopColor="#ffffff" stopOpacity={0.35} />
                <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect width={SHINE_BAND} height={bandHeight} fill="url(#btnShine)" />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}

// Plain (non-Unistyles) object — this sits on an `Animated.View`. Merging a
// Unistyles `styles.X` into an `Animated.*` style array trips Reanimated 4.5's
// "empty object is not a valid style value" (the entry resolves to {} before the
// ShadowNode binding populates). See SplashScreen's `flexFill` + CLAUDE.md →
// Reanimated + Unistyles.
const shineBand = {
  position: 'absolute',
  left: 0,
  width: SHINE_BAND,
} as const;

const styles = StyleSheet.create((theme) => ({
  shineClip: {
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
}));
