import { StyleSheet } from 'react-native-unistyles';
import { font } from './font';
import { typography } from './typography';
import { spacing, gap } from './spacing';
import { radius } from './radius';
import { zIndex } from './z-index';
import { opacity } from './opacity';
import { colors, highlights } from './colors';
import { shadows } from './shadows';
import { motion } from './motion';

// --- App config ---

const sharedTokens = {
  font,
  typography,
  spacing,
  radius,
  zIndex,
  opacity,
  gap,
  motion,
  highlights,
} as const;

const lightTheme = {
  colors: colors.light,
  shadows: shadows.light,
  ...sharedTokens,
} as const;

const darkTheme = {
  colors: colors.dark,
  shadows: shadows.dark,
  ...sharedTokens,
} as const;

const sepiaTheme = {
  colors: colors.sepia,
  shadows: shadows.light,
  ...sharedTokens,
} as const;

const appThemes = {
  light: lightTheme,
  dark: darkTheme,
  sepia: sepiaTheme,
};

const breakpoints = {
  xs: 0,
  sm: 300,
  md: 500,
  lg: 800,
  xl: 1200,
};

type AppBreakpoints = typeof breakpoints;
type AppThemes = typeof appThemes;

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends AppThemes {}
  export interface UnistylesBreakpoints extends AppBreakpoints {}
}

StyleSheet.configure({
  settings: {
    // Sepia is the default app theme — matches the theme store's initial value
    // (`src/stores/theme.ts`). This is the pre-hydration paint; the store's
    // `onRehydrateStorage` then applies any persisted user choice.
    initialTheme: 'sepia',
  },
  breakpoints,
  themes: appThemes,
});
