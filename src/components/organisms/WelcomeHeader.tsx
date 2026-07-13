import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  FeGaussianBlur,
  Filter,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { StyleSheet } from 'react-native-unistyles';
import { Card } from '@/components/molecules';
import { useThemeStore } from '@/stores/theme';
import { typography } from '@/theme/typography';

export type TimeOfDay = 'morning' | 'noon' | 'night';

type WelcomeHeaderProps = {
  greeting: string;
  subtitle: string;
  /** Which scene to render. Drives the sky/celestial-body/animation set. */
  timeOfDay: TimeOfDay;
};

// The card is rendered at a fixed aspect so the SVG scene composes predictably;
// width is driven by the parent (flexes to the content column), height derived.
const SCENE_WIDTH = 400;
const SCENE_HEIGHT = 200;
const CARD_HEIGHT = 168;

// ── Scene palettes ──────────────────────────────────────────────────────────
// The scene is its own little world: it does NOT read the app's semantic text
// colors (the copy sits on a colored sky, not the app background). The palette
// varies by app theme (light / sepia / dark) so the card blends with each —
// matching the three rows in the design mocks. The greeting copy is always white
// (it sits fully over the dark front hill), so it isn't part of the palette.

type ScenePalette = {
  skyTop: string;
  skyBottom: string;
  hillBack: string;
  hillFront: string;
  body: string; // sun / moon fill
  bodyGlow: string;
  cloud: string; // also the star color at night
};

type SceneKind = 'light' | 'sepia' | 'dark';

function sceneKind(themeName: string): SceneKind {
  if (themeName === 'dark') return 'dark';
  if (themeName === 'sepia') return 'sepia';
  return 'light';
}

// [themeKind][timeOfDay] → palette. Kept as data so the render stays declarative.
const PALETTES: Record<SceneKind, Record<TimeOfDay, ScenePalette>> = {
  light: {
    morning: {
      skyTop: '#C7D8E4',
      skyBottom: '#E9E4D2',
      hillBack: '#7E9179',
      hillFront: '#4F6B52',
      body: '#F2C94C',
      bodyGlow: '#F7D874',
      cloud: '#FFFFFF',
    },
    noon: {
      skyTop: '#BFD6E8',
      skyBottom: '#D7E3E9',
      hillBack: '#7E9179',
      hillFront: '#4F6B52',
      body: '#F2C94C',
      bodyGlow: '#F8DE7E',
      cloud: '#FFFFFF',
    },
    night: {
      skyTop: '#2E3C55',
      skyBottom: '#3A4A63',
      hillBack: '#33463A',
      hillFront: '#22331F',
      body: '#F4EAC4',
      bodyGlow: '#FBF3D4',
      cloud: '#F4F1E6',
    },
  },
  sepia: {
    morning: {
      skyTop: '#DAD3B8',
      skyBottom: '#E6DEC4',
      hillBack: '#8A9679',
      hillFront: '#4F6B52',
      body: '#EBC65B',
      bodyGlow: '#F3D77C',
      cloud: '#F7F2E4',
    },
    noon: {
      skyTop: '#D5CFB2',
      skyBottom: '#E3DCC1',
      hillBack: '#8A9679',
      hillFront: '#4F6B52',
      body: '#EBC65B',
      bodyGlow: '#F3DA84',
      cloud: '#F7F2E4',
    },
    night: {
      skyTop: '#3A3428',
      skyBottom: '#4A4234',
      hillBack: '#3E4632',
      hillFront: '#2A3020',
      body: '#F0E4BE',
      bodyGlow: '#F8EFCE',
      cloud: '#EDE7D3',
    },
  },
  dark: {
    morning: {
      skyTop: '#2A3341',
      skyBottom: '#33302B',
      hillBack: '#38493A',
      hillFront: '#233524',
      body: '#E7C25A',
      bodyGlow: '#F0D278',
      cloud: '#3C4551',
    },
    noon: {
      skyTop: '#28303C',
      skyBottom: '#2C333B',
      hillBack: '#38493A',
      hillFront: '#233524',
      body: '#E7C25A',
      bodyGlow: '#F0D682',
      cloud: '#3A424E',
    },
    night: {
      skyTop: '#1B2536',
      skyBottom: '#212B3D',
      hillBack: '#233524',
      hillFront: '#16210F',
      body: '#EBE0BE',
      bodyGlow: '#F5EDD2',
      cloud: '#E7E1CE',
    },
  },
};

// Horizontal center of the celestial body per time-of-day (matches the mocks:
// sun rises on the left in the morning, climbs to center at noon, moon sits
// upper-right at night).
const BODY_X: Record<TimeOfDay, number> = {
  morning: 96,
  noon: 200,
  night: 300,
};
const BODY_Y = 60;
const BODY_R = 26;

// Scattered stars (in scene coords), each twinkling on a staggered delay. Only
// shown at night.
const STARS = [
  { x: 42, y: 44, r: 1.6, delay: 0 },
  { x: 96, y: 30, r: 1.2, delay: 600 },
  { x: 150, y: 52, r: 1.4, delay: 1100 },
  { x: 128, y: 90, r: 1, delay: 300 },
  { x: 220, y: 40, r: 1.3, delay: 900 },
  { x: 250, y: 74, r: 1, delay: 1500 },
  { x: 190, y: 96, r: 1.2, delay: 400 },
  { x: 336, y: 118, r: 1.4, delay: 1300 },
  { x: 360, y: 58, r: 1, delay: 700 },
];

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Crescent moon as a single filled shape: the outer arc is a full circle of
// radius r; the inner arc is a larger circle offset up-left, so subtracting it
// (via the path's opposing sweep) leaves a clean crescent — no second disc
// cutout, so nothing but the sky shows through the "dark" side.
function crescentPath(cx: number, cy: number, r: number) {
  const top = `${cx} ${cy - r}`;
  const bottom = `${cx} ${cy + r}`;
  const innerR = r * 1.35; // larger → thinner crescent
  return [
    `M ${top}`,
    // Outer (lit) edge: right-hand semicircle sweeping down.
    `A ${r} ${r} 0 1 1 ${bottom}`,
    // Inner (terminator) edge: arc back up, bulging left to carve the crescent.
    `A ${innerR} ${innerR} 0 0 0 ${top}`,
    'Z',
  ].join(' ');
}

// A single twinkling star — a slow opacity fade in/out on a staggered delay,
// driven on the UI thread (no React re-render per frame).
function TwinkleStar({ x, y, r, delay, color }: { x: number; y: number; r: number; delay: number; color: string }) {
  const opacity = useSharedValue(0.2);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }), -1, true)
    );
    return () => cancelAnimation(opacity);
  }, [opacity, delay]);

  const animatedProps = useAnimatedProps(() => ({ opacity: opacity.value }));

  return <AnimatedCircle cx={x} cy={y} r={r} fill={color} animatedProps={animatedProps} />;
}

export function WelcomeHeader({ greeting, subtitle, timeOfDay }: WelcomeHeaderProps) {
  const themeName = useThemeStore((s) => s.theme);
  const palette = PALETTES[sceneKind(themeName)][timeOfDay];
  const isNight = timeOfDay === 'night';
  const bodyX = BODY_X[timeOfDay];

  // The sun/moon (and its glow) gently bobs up and down. One shared value drives
  // the whole celestial group via a wrapping Animated.View so it stays on the UI
  // thread; the SVG itself is static.
  const bob = useSharedValue(0);
  useEffect(() => {
    bob.value = withRepeat(withTiming(1, { duration: 3600, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(bob);
  }, [bob]);

  const bobStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -3 + bob.value * 6 }],
  }));

  return (
    <Card style={styles.card}>
      {/* Sky + hills + stars: the static backdrop. */}
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
        preserveAspectRatio="xMidYMid slice"
        style={sceneFill}
      >
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.skyTop} />
            <Stop offset="1" stopColor={palette.skyBottom} />
          </LinearGradient>
          {/* Real gaussian blur so the day clouds read as soft haze, not hard
              ellipses. Generous region so the blur isn't clipped at the edges. */}
          <Filter id="cloudBlur" x="-50%" y="-50%" width="200%" height="200%">
            <FeGaussianBlur stdDeviation="9" />
          </Filter>
        </Defs>

        <Rect x="0" y="0" width={SCENE_WIDTH} height={SCENE_HEIGHT} fill="url(#sky)" />

        {/* Soft blurred clouds (day only) — each is a couple of overlapping
            ellipses run through the blur filter so they melt into the sky. */}
        {!isNight && (
          <>
            <G filter="url(#cloudBlur)" opacity={0.7}>
              <Ellipse cx={92} cy={54} rx={40} ry={13} fill={palette.cloud} />
              <Ellipse cx={116} cy={50} rx={26} ry={11} fill={palette.cloud} />
              <Ellipse cx={70} cy={58} rx={22} ry={10} fill={palette.cloud} />
            </G>
            <G filter="url(#cloudBlur)" opacity={0.55}>
              <Ellipse cx={306} cy={82} rx={44} ry={13} fill={palette.cloud} />
              <Ellipse cx={330} cy={78} rx={24} ry={10} fill={palette.cloud} />
            </G>
          </>
        )}

        {isNight &&
          STARS.map((s, i) => <TwinkleStar key={i} x={s.x} y={s.y} r={s.r} delay={s.delay} color={palette.cloud} />)}

        {/* Back + front rolling hills. The front hill crests high on the LEFT
            (the text side) and slopes down to the right, so the greeting copy
            always sits fully over green — guaranteed contrast for white text. */}
        <Path
          d={`M0 ${SCENE_HEIGHT} L0 116 C 70 108, 150 128, 230 122 S 360 104, ${SCENE_WIDTH} 118 L${SCENE_WIDTH} ${SCENE_HEIGHT} Z`}
          fill={palette.hillBack}
        />
        <Path
          d={`M0 ${SCENE_HEIGHT} L0 104 C 80 100, 150 138, 250 150 S 350 140, ${SCENE_WIDTH} 146 L${SCENE_WIDTH} ${SCENE_HEIGHT} Z`}
          fill={palette.hillFront}
        />
      </Svg>

      {/* Celestial body layer — bobs on the UI thread over the static scene. */}
      <Animated.View style={[sceneFill, bobStyle]} pointerEvents="none">
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
          preserveAspectRatio="xMidYMid slice"
        >
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={palette.bodyGlow} stopOpacity={0.55} />
              <Stop offset="1" stopColor={palette.bodyGlow} stopOpacity={0} />
            </RadialGradient>
          </Defs>

          <Circle cx={bodyX} cy={BODY_Y} r={BODY_R * 2.1} fill="url(#glow)" />

          {isNight ? (
            <Path d={crescentPath(bodyX, BODY_Y, BODY_R)} fill={palette.body} />
          ) : (
            <Circle cx={bodyX} cy={BODY_Y} r={BODY_R} fill={palette.body} />
          )}
        </Svg>
      </Animated.View>

      {/* Greeting copy, bottom-left over the front hill — always white for
          contrast on every scene, with a soft shadow to lift it off the green. */}
      <View style={styles.copy} pointerEvents="none">
        <Animated.Text style={titleText}>{greeting}</Animated.Text>
        <Animated.Text style={subtitleText}>{subtitle}</Animated.Text>
      </View>
    </Card>
  );
}

// Plain (non-Unistyles) objects — these sit on `Animated.*` surfaces / SVG
// layers where a Unistyles `styles.X` would trip Reanimated 4.5's "empty object
// is not a valid style value". See CLAUDE.md → Reanimated + Unistyles, AnimatedSun.
const sceneFill = {
  ...StyleSheet.absoluteFillObject,
} as const;

const TEXT_SHADOW = {
  textShadowColor: 'rgba(0,0,0,0.35)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 4,
} as const;

const titleText = {
  fontFamily: typography.reader.families.serif,
  fontSize: 28,
  fontWeight: '700',
  lineHeight: 34,
  color: '#FFFFFF',
  ...TEXT_SHADOW,
} as const;

const subtitleText = {
  fontFamily: typography.reader.families.sans,
  fontSize: 15,
  lineHeight: 20,
  color: 'rgba(255,255,255,0.88)',
  ...TEXT_SHADOW,
} as const;

const styles = StyleSheet.create((theme) => ({
  // Reuse the shared `Card` surface (bg + radius['2xl'] + shadows.lg) but strip
  // its padding/gap since the SVG scene fills the card edge-to-edge, and clip the
  // scene to the rounded corners.
  card: {
    height: CARD_HEIGHT,
    padding: 0,
    gap: 0,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  copy: {
    paddingHorizontal: theme.spacing[5],
    paddingBottom: theme.spacing[4],
  },
}));
