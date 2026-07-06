import { typography } from './typography';

export const font = {
  family: typography.reader.families.serif,
  sizes: {
    display: 34,
    title1: 28,
    title2: 22,
    title3: 18,
    body: 17,
    bodyEmphasis: 17,
    callout: 15,
    caption: 10,
    label: 13,
    overline: 11,
  },
  lineHeights: {
    display: 40,
    title1: 38,
    title2: 28,
    title3: 24,
    body: 24,
    bodyEmphasis: 24,
    callout: 20,
    caption: 16,
    label: 18,
    overline: 16,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  letterSpacing: {
    tighter: -0.8,
    tight: -0.4,
    normal: 0,
    wide: 0.4,
    wider: 0.8,
  },
} as const;
