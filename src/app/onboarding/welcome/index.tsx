import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, LinearGradient, Stop } from 'react-native-svg';
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles';
import { ChevronRight } from 'lucide-react-native';
import { Button, Text, TEXT_VARIANTS, SafeAreaView } from '@/components/atoms';
import { useTranslate } from '@/i18n';
import { useThemeStore } from '@/stores/theme';
import { typography } from '@/theme/typography';
import useOnboardingWelcomeScreen from './use-onboarding-welcome-screen';
import { BUTTON_SIZES, BUTTON_VARIANTS } from '@/components/atoms/Button';

const SUN_BOX = 260;
const SUN_SIZE = 220;
const VIEWBOX = 200;
const CENTER = VIEWBOX / 2;
const RAY_COUNT = 24;
const RAY_INNER = 48;
const RAY_OUTER = 100;

// Precompute the sunburst ray endpoints once — the lines are static; only the
// wrapping Animated.View rotates/pulses, keeping the work off the UI thread.
const RAYS = Array.from({ length: RAY_COUNT }, (_, i) => {
  const angle = (i * 2 * Math.PI) / RAY_COUNT;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x1: CENTER + RAY_INNER * cos,
    y1: CENTER + RAY_INNER * sin,
    x2: CENTER + RAY_OUTER * cos,
    y2: CENTER + RAY_OUTER * sin,
  };
});

// Scattered stars (fractions of SUN_BOX) that twinkle on staggered delays.
const STARS = [
  { top: 0.16, left: 0.14, size: 4, delay: 0 },
  { top: 0.28, left: 0.84, size: 3, delay: 500 },
  { top: 0.68, left: 0.1, size: 3, delay: 900 },
  { top: 0.8, left: 0.78, size: 4, delay: 1300 },
  { top: 0.52, left: 0.93, size: 2, delay: 700 },
  { top: 0.12, left: 0.6, size: 2, delay: 1100 },
];

const PULSE_DURATION = 2600;

function Star({
  top,
  left,
  size,
  delay,
  color,
}: {
  top: number;
  left: number;
  size: number;
  delay: number;
  color: string;
}) {
  const opacity = useSharedValue(0.15);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }), -1, true)
    );
    return () => cancelAnimation(opacity);
  }, [opacity, delay]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { position: 'absolute', top, left, width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        style,
      ]}
    />
  );
}

function AnimatedSun() {
  const themeName = useThemeStore((s) => s.theme);
  const { colors } = UnistylesRuntime.getTheme(themeName);
  const accent = colors.semantic.accent;

  const rotate = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    rotate.value = withRepeat(withTiming(1, { duration: 60000, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(withTiming(1, { duration: PULSE_DURATION, easing: Easing.inOut(Easing.quad) }), -1, true);
    return () => {
      cancelAnimation(rotate);
      cancelAnimation(pulse);
    };
  }, [rotate, pulse]);

  const raysStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + pulse.value * 0.45,
    transform: [{ rotate: `${rotate.value * 360}deg` }, { scale: 0.95 + pulse.value * 0.08 }],
  }));

  return (
    <View style={styles.sunBox}>
      {STARS.map((s, i) => (
        <Star key={i} top={s.top * SUN_BOX} left={s.left * SUN_BOX} size={s.size} delay={s.delay} color={accent} />
      ))}

      <Animated.View style={[styles.sunLayer, raysStyle]}>
        <Svg width={SUN_SIZE} height={SUN_SIZE} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
          <Defs>
            {/* One gradient per ray, aligned to the ray's direction (userSpaceOnUse),
                so each line fades from accent at the center to transparent at the tip. */}
            {RAYS.map((r, i) => (
              <LinearGradient
                key={i}
                id={`ray${i}`}
                x1={r.x1}
                y1={r.y1}
                x2={r.x2}
                y2={r.y2}
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0" stopColor={accent} stopOpacity={0.55} />
                <Stop offset="1" stopColor={accent} stopOpacity={0} />
              </LinearGradient>
            ))}
          </Defs>
          {RAYS.map((r, i) => (
            <Line
              key={i}
              x1={r.x1}
              y1={r.y1}
              x2={r.x2}
              y2={r.y2}
              stroke={`url(#ray${i})`}
              strokeWidth={1.2}
              strokeLinecap="round"
            />
          ))}
          <Circle cx={CENTER} cy={CENTER} r={42} stroke={accent} strokeWidth={1} fill="none" opacity={0.22} />
          <Circle cx={CENTER} cy={CENTER} r={58} stroke={accent} strokeWidth={1} fill="none" opacity={0.12} />
        </Svg>
      </Animated.View>

      <View style={styles.sunLayer}>
        <Svg width={SUN_SIZE} height={SUN_SIZE} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
          <Circle cx={CENTER} cy={CENTER} r={26} stroke={accent} strokeWidth={1.5} fill="none" opacity={0.4} />
          <Circle cx={CENTER} cy={CENTER} r={15} stroke={accent} strokeWidth={2} fill="none" />
          <Circle cx={CENTER} cy={CENTER} r={5} fill={accent} />
        </Svg>
      </View>
    </View>
  );
}

export default function OnboardingWelcomeScreen() {
  const { handleStartReading, handleExplorePlans } = useOnboardingWelcomeScreen();
  const t = useTranslate();

  const glow = useSharedValue(0);

  useEffect(() => {
    glow.value = withRepeat(withTiming(1, { duration: PULSE_DURATION, easing: Easing.inOut(Easing.quad) }), -1, true);
    return () => cancelAnimation(glow);
  }, [glow]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.18 + glow.value * 0.32,
    shadowRadius: 10 + glow.value * 14,
  }));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <AnimatedSun />

        <View style={styles.copy}>
          <Text variant={TEXT_VARIANTS.Overline} color="accent" style={styles.overline}>
            {t('onboarding.welcome.overline')}
          </Text>
          <Text variant={TEXT_VARIANTS.Display} style={styles.title}>
            {t('onboarding.welcome.title')}
          </Text>
          <Text style={styles.verse}>{t('onboarding.welcome.verse')}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Animated.View style={[styles.glow, glowStyle]}>
          <Button
            label={t('onboarding.welcome.startButton')}
            size={BUTTON_SIZES.Large}
            fullWidth
            onPress={handleStartReading}
          />
        </Animated.View>
        <Button
          label={t('onboarding.welcome.plansButton')}
          variant={BUTTON_VARIANTS.Ghost}
          size={BUTTON_SIZES.Large}
          fullWidth
          icon={<ChevronRight size={18} color={styles.chevron.color} strokeWidth={2.5} />}
          iconPosition="right"
          onPress={handleExplorePlans}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.semantic.bgPrimary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[6],
    gap: theme.spacing[10],
  },
  sunBox: {
    width: SUN_BOX,
    height: SUN_BOX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunLayer: {
    position: 'absolute',
    width: SUN_SIZE,
    height: SUN_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  overline: {
    textAlign: 'center',
  },
  title: {
    textAlign: 'center',
    fontFamily: typography.reader.families.serif,
  },
  verse: {
    textAlign: 'center',
    color: theme.colors.semantic.textSecondary,
    fontFamily: typography.reader.families.serif,
    fontStyle: 'italic',
    fontSize: theme.font.sizes.title3,
    lineHeight: theme.font.lineHeights.title2,
  },
  chevron: {
    color: theme.colors.semantic.accent,
  },
  footer: {
    paddingHorizontal: theme.spacing[5],
    paddingBottom: theme.spacing[6],
    paddingTop: theme.spacing[4],
    gap: theme.spacing[2],
  },
  glow: {
    borderRadius: theme.radius.lg,
    shadowColor: theme.colors.semantic.accent,
    shadowOffset: { width: 0, height: 6 },
  },
}));
