import { type ViewStyle } from 'react-native';
import { PressableScale, type CustomPressableProps } from 'pressto';
import { StyleSheet } from 'react-native-unistyles';
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
  return (
    <PressableScale
      style={[
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style as ViewStyle,
      ]}
      disabled={disabled}
      {...rest}
    >
      {iconPosition === 'left' && icon}
      <Text
        variant={size === BUTTON_SIZES.Small ? TEXT_VARIANTS.Caption : TEXT_VARIANTS.Callout}
        style={[textVariantStyles[variant]]}
      >
        {label}
      </Text>
      {iconPosition === 'right' && icon}
    </PressableScale>
  );
}

const styles = StyleSheet.create((theme) => ({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    gap: theme.spacing[2],
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
}));

const sizeStyles = StyleSheet.create((theme) => ({
  sm: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1.5],
    borderRadius: theme.radius.sm,
  },
  md: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.radius.md,
  },
  lg: {
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[4],
    borderRadius: theme.radius.lg,
  },
}));

const variantStyles = StyleSheet.create((theme) => ({
  primary: {
    backgroundColor: theme.colors.semantic.accent,
  },
  secondary: {
    backgroundColor: theme.colors.semantic.bgSecondary,
    borderWidth: 1,
    borderColor: theme.colors.semantic.accent,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  destructive: {
    backgroundColor: theme.colors.semantic.danger,
  },
  pro: {
    backgroundColor: theme.colors.semantic.accentSubtle,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.semantic.accent,
  },
}));

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
