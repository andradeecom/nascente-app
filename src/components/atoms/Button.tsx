import { type ViewStyle } from 'react-native';
import { PressableScale, type CustomPressableProps } from 'pressto';
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles';
import { useThemeStore } from '@/stores/theme';
import { Text, TEXT_VARIANTS } from './Text';

export enum BUTTON_VARIANTS {
  Primary = 'primary',
  Secondary = 'secondary',
  Ghost = 'ghost',
  Destructive = 'destructive',
  Pro = 'pro',
}
export type ButtonVariant = (typeof BUTTON_VARIANTS)[keyof typeof BUTTON_VARIANTS];

export enum BUTTON_SIZES {
  Small = 'sm',
  Medium = 'md',
  Large = 'lg',
}
export type ButtonSize = (typeof BUTTON_SIZES)[keyof typeof BUTTON_SIZES];

type ButtonProps = CustomPressableProps & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  label: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
};

/**
 * Convert a `style` prop (possibly a Unistyles `styles.X`, an array, or a plain
 * object) into a truly plain style object safe to pass to a Reanimated-based
 * component (`pressto`'s `PressableScale`). Unistyles' Babel plugin adds a
 * `unistyles_<hash>` marker key (the C++ binding) to processed styles; on a
 * non-Unistyles surface that marker stays `{}` and Reanimated rejects it, so we
 * copy only the real style keys, recursing through arrays. `StyleSheet.flatten`
 * can't be used here — it keeps the marker. See CLAUDE.md → Reanimated + Unistyles.
 */
function toPlainStyle(input: unknown): ViewStyle {
  if (!input) return {};
  if (Array.isArray(input)) {
    return input.reduce<ViewStyle>((acc, entry) => Object.assign(acc, toPlainStyle(entry)), {});
  }
  if (typeof input !== 'object') return {};
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(input)) {
    if (key.startsWith('unistyles_')) continue;
    const value = (input as Record<string, unknown>)[key];
    if (typeof value === 'function') continue;
    out[key] = value;
  }
  return out as ViewStyle;
}

export function Button({
  variant = BUTTON_VARIANTS.Primary,
  size = BUTTON_SIZES.Medium,
  label,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  disabled,
  ...rest
}: ButtonProps) {
  // Not wrapped with withUnistyles: PressableScale (pressto) is Reanimated-based,
  // and forcing it to re-render on every theme tick would trip Reanimated's strict-mode
  // "reading value during render" warning. Read theme name reactively and derive plain styles instead.
  const themeName = useThemeStore((s) => s.theme);
  const theme = UnistylesRuntime.getTheme(themeName);

  const variantStyle: ViewStyle = {
    primary: { backgroundColor: theme.colors.semantic.accent },
    secondary: {
      backgroundColor: theme.colors.semantic.bgSecondary,
      borderWidth: 1,
      borderColor: theme.colors.semantic.accent,
    },
    ghost: { backgroundColor: 'transparent' },
    destructive: { backgroundColor: theme.colors.semantic.danger },
    pro: {
      backgroundColor: theme.colors.semantic.accentSubtle,
      borderWidth: 1,
      borderStyle: 'dashed' as const,
      borderColor: theme.colors.semantic.accent,
    },
  }[variant];

  const sizeStyle: ViewStyle = {
    sm: { paddingHorizontal: theme.spacing[3], paddingVertical: theme.spacing[1.5], borderRadius: theme.radius.sm },
    md: { paddingHorizontal: theme.spacing[4], paddingVertical: theme.spacing[3], borderRadius: theme.radius.md },
    lg: { paddingHorizontal: theme.spacing[6], paddingVertical: theme.spacing[4], borderRadius: theme.radius.lg },
  }[size];

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    gap: theme.spacing[2],
    ...sizeStyle,
    ...variantStyle,
    ...(fullWidth && { width: '100%' }),
    ...(disabled && { opacity: 0.5 }),
  };

  // `PressableScale` (pressto) is Reanimated-based. Under Reanimated 4.5 +
  // Unistyles 3.1 (Expo 57 / RN 0.86), handing it a Unistyles-processed
  // `styles.X` — which many callers pass as `style` (e.g. `ProLockCard`'s
  // `styles.cta`) — throws `[Reanimated] Invalid value for "unistyles_<hash>":
  // an empty object is not a valid style value`: Unistyles' Babel plugin injects
  // a `unistyles_<hash>` marker prop (the C++ ShadowNode binding) onto the style
  // object, and since `PressableScale` isn't a Unistyles surface that marker is
  // never bound, so it stays `{}` and Reanimated's validator rejects it.
  // `StyleSheet.flatten` does NOT help — it preserves the marker. We instead
  // strip it to a truly plain object via `toPlainStyle`. `containerStyle` is
  // already plain; the caller `style` is the one that may carry the marker.
  // Button re-derives on `themeName` (subscription above), so themed caller
  // overrides still refresh on a theme switch. See CLAUDE.md → Reanimated + Unistyles.
  const plainStyle = { ...containerStyle, ...toPlainStyle(style) };

  return (
    <PressableScale style={plainStyle} disabled={disabled} {...rest}>
      {iconPosition === 'left' && icon}
      <Text
        variant={size === BUTTON_SIZES.Small ? TEXT_VARIANTS.Overline : TEXT_VARIANTS.Label}
        style={[textVariantStyles[variant]]}
      >
        {label}
      </Text>
      {iconPosition === 'right' && icon}
    </PressableScale>
  );
}

const textVariantStyles = StyleSheet.create((theme) => ({
  primary: {
    color: theme.colors.semantic.bgPrimary,
    fontWeight: theme.font.weights.semibold,
  },
  secondary: {
    color: theme.colors.semantic.accent,
    fontWeight: theme.font.weights.medium,
  },
  ghost: {
    color: theme.colors.semantic.accent,
    fontWeight: theme.font.weights.medium,
  },
  destructive: {
    color: theme.colors.semantic.bgPrimary,
    fontWeight: theme.font.weights.semibold,
  },
  pro: {
    color: theme.colors.semantic.accent,
    fontWeight: theme.font.weights.medium,
  },
}));
