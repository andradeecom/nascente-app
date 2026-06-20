import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

type TextVariant =
  | 'display'
  | 'title1'
  | 'title2'
  | 'title3'
  | 'body'
  | 'bodyEmphasis'
  | 'callout'
  | 'caption'
  | 'label'
  | 'overline';

type TextProps = RNTextProps & {
  variant?: TextVariant;
  color?: 'textPrimary' | 'textSecondary' | 'textTertiary' | 'accent' | 'danger';
};

export function Text({ style, variant = 'body', color = 'textPrimary', ...rest }: TextProps) {
  return <RNText style={[styles.base, variantStyles[variant], colorStyles[color], style]} {...rest} />;
}

const styles = StyleSheet.create((theme) => ({
  base: {
    fontFamily: theme.font.family,
    color: theme.colors.semantic.textPrimary,
  },
}));

const variantStyles = StyleSheet.create((theme) => ({
  display: {
    fontSize: theme.font.sizes.display,
    lineHeight: theme.font.lineHeights.display,
    fontWeight: theme.font.weights.bold,
    letterSpacing: theme.font.letterSpacing.tight,
  },
  title1: {
    fontSize: theme.font.sizes.title1,
    lineHeight: theme.font.lineHeights.title1,
    fontWeight: theme.font.weights.semibold,
    letterSpacing: theme.font.letterSpacing.tight,
  },
  title2: {
    fontSize: theme.font.sizes.title2,
    lineHeight: theme.font.lineHeights.title2,
    fontWeight: theme.font.weights.semibold,
  },
  title3: {
    fontSize: theme.font.sizes.title3,
    lineHeight: theme.font.lineHeights.title3,
    fontWeight: theme.font.weights.semibold,
  },
  body: {
    fontSize: theme.font.sizes.body,
    lineHeight: theme.font.lineHeights.body,
    fontWeight: theme.font.weights.regular,
  },
  bodyEmphasis: {
    fontSize: theme.font.sizes.bodyEmphasis,
    lineHeight: theme.font.lineHeights.bodyEmphasis,
    fontWeight: theme.font.weights.semibold,
  },
  callout: {
    fontSize: theme.font.sizes.callout,
    lineHeight: theme.font.lineHeights.callout,
    fontWeight: theme.font.weights.regular,
  },
  caption: {
    fontSize: theme.font.sizes.caption,
    lineHeight: theme.font.lineHeights.caption,
    fontWeight: theme.font.weights.regular,
  },
  label: {
    fontSize: theme.font.sizes.label,
    lineHeight: theme.font.lineHeights.label,
    fontWeight: theme.font.weights.medium,
  },
  overline: {
    fontSize: theme.font.sizes.overline,
    lineHeight: theme.font.lineHeights.overline,
    fontWeight: theme.font.weights.semibold,
    letterSpacing: theme.font.letterSpacing.wider,
  },
}));

const colorStyles = StyleSheet.create((theme) => ({
  textPrimary: { color: theme.colors.semantic.textPrimary },
  textSecondary: { color: theme.colors.semantic.textSecondary },
  textTertiary: { color: theme.colors.semantic.textTertiary },
  accent: { color: theme.colors.semantic.accent },
  danger: { color: theme.colors.semantic.danger },
}));
