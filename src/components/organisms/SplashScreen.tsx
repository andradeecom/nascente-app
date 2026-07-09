import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { StyleSheet } from 'react-native-unistyles';

interface SplashScreenProps {
  onReady?: () => void;
  onFinish?: () => void;
}

export function SplashScreen({ onReady, onFinish }: SplashScreenProps) {
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  });

  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);
  const captionOpacity = useSharedValue(0);
  const screenOpacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });

    scale.value = withSequence(
      withTiming(1.08, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(1, {
        duration: 200,
        easing: Easing.inOut(Easing.quad),
      })
    );

    captionOpacity.value = withDelay(
      500,
      withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.quad),
      })
    );

    const handleFinish = () => {
      onFinishRef.current?.();
    };

    screenOpacity.value = withDelay(
      1600,
      withTiming(0, { duration: 300, easing: Easing.in(Easing.quad) }, (finished) => {
        if (finished) {
          scheduleOnRN(handleFinish);
        }
      })
    );
  }, [captionOpacity, opacity, scale, screenOpacity]);

  const letterStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const captionStyle = useAnimatedStyle(() => ({
    opacity: captionOpacity.value,
  }));

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  // Static Unistyles styles live on plain RN views; each Animated.* carries only
  // its animated style. Merging a Unistyles style into an Animated.* style array
  // trips Reanimated 4.5's "empty object is not a valid style value" during the
  // pre-paint splash window (the Unistyles array entry resolves to {} before the
  // ShadowNode binding populates). See CLAUDE.md → Reanimated + Unistyles.
  return (
    <Animated.View style={[flexFill, screenStyle]} onLayout={onReady}>
      <View style={styles.container}>
        <View style={styles.center}>
          <Animated.Text style={letterStyle}>
            <Text style={styles.letter}>N</Text>
          </Animated.Text>
        </View>
        <Animated.Text style={captionStyle}>
          <Text style={styles.caption}>nascente.app</Text>
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

// Plain (non-Unistyles) object so it can be merged into the Animated.View style
// array without hitting the Reanimated empty-object validation (see render note).
const flexFill = { flex: 1 } as const;

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: theme.spacing[8],
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  letter: {
    fontFamily: theme.font.family,
    fontSize: 120,
    lineHeight: 140,
    color: theme.colors.primary,
    includeFontPadding: false,
  },
  caption: {
    fontFamily: theme.font.family,
    fontSize: theme.font.sizes.callout,
    color: theme.colors.mutedForeground,
    letterSpacing: theme.font.letterSpacing.wide,
  },
}));
