const light = {
  background: '#FFFFFF',
  foreground: '#1A1A1A',

  card: '#F7F7F5',
  cardForeground: '#1A1A1A',

  popover: '#FFFFFF',
  popoverForeground: '#1A1A1A',

  primary: '#4A6C4F',
  primaryForeground: '#FFFFFF',

  secondary: '#F7F7F5',
  secondaryForeground: '#1A1A1A',

  muted: '#F7F7F5',
  mutedForeground: '#6B6B6B',

  accent: '#E8F0E9',
  accentForeground: '#4A6C4F',

  destructive: '#C0392B',
  destructiveForeground: '#FFFFFF',

  success: '#4A6C4F',
  successForeground: '#FFFFFF',

  warning: '#D4A017',
  warningForeground: '#FFFFFF',

  info: '#3B6E8F',
  infoForeground: '#FFFFFF',

  border: '#EBEBE5',
  input: '#EBEBE5',
  ring: '#4A6C4F',

  semantic: {
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F7F7F5',
    bgTertiary: '#EBEBE5',

    textPrimary: '#1A1A1A',
    textSecondary: '#6B6B6B',
    textTertiary: '#9E9E9E',

    accent: '#4A6C4F',
    accentSubtle: '#E8F0E9',

    danger: '#C0392B',
    warning: '#D4A017',
    info: '#3B6E8F',
  },
} as const;

const dark = {
  background: '#121212',
  foreground: '#F0F0F0',

  card: '#1E1E1E',
  cardForeground: '#F0F0F0',

  popover: '#121212',
  popoverForeground: '#F0F0F0',

  primary: '#7A9E7E',
  primaryForeground: '#121212',

  secondary: '#1E1E1E',
  secondaryForeground: '#F0F0F0',

  muted: '#1E1E1E',
  mutedForeground: '#A0A0A0',

  accent: '#2A3D2C',
  accentForeground: '#7A9E7E',

  destructive: '#E74C3C',
  destructiveForeground: '#121212',

  success: '#7A9E7E',
  successForeground: '#121212',

  warning: '#F1C40F',
  warningForeground: '#121212',

  info: '#5A9EC4',
  infoForeground: '#121212',

  border: '#2C2C2C',
  input: '#2C2C2C',
  ring: '#7A9E7E',

  semantic: {
    bgPrimary: '#121212',
    bgSecondary: '#1E1E1E',
    bgTertiary: '#2C2C2C',

    textPrimary: '#F0F0F0',
    textSecondary: '#A0A0A0',
    textTertiary: '#757575',

    accent: '#7A9E7E',
    accentSubtle: '#2A3D2C',

    danger: '#E74C3C',
    warning: '#F1C40F',
    info: '#5A9EC4',
  },
} as const;

const sepia = {
  background: '#F5F0E6',
  foreground: '#2B2118',

  card: '#EDE6D6',
  cardForeground: '#2B2118',

  popover: '#F5F0E6',
  popoverForeground: '#2B2118',

  primary: '#5D7B61',
  primaryForeground: '#F5F0E6',

  secondary: '#EDE6D6',
  secondaryForeground: '#2B2118',

  muted: '#EDE6D6',
  mutedForeground: '#7A6B5A',

  accent: '#DDE6D9',
  accentForeground: '#5D7B61',

  destructive: '#B23629',
  destructiveForeground: '#F5F0E6',

  success: '#5D7B61',
  successForeground: '#F5F0E6',

  warning: '#C69316',
  warningForeground: '#F5F0E6',

  info: '#4A6B85',
  infoForeground: '#F5F0E6',

  border: '#E3D9C5',
  input: '#E3D9C5',
  ring: '#5D7B61',

  semantic: {
    bgPrimary: '#F5F0E6',
    bgSecondary: '#EDE6D6',
    bgTertiary: '#E3D9C5',

    textPrimary: '#2B2118',
    textSecondary: '#7A6B5A',
    textTertiary: '#A89B89',

    accent: '#5D7B61',
    accentSubtle: '#DDE6D9',

    danger: '#B23629',
    warning: '#C69316',
    info: '#4A6B85',
  },
} as const;

export const colors = {
  light,
  dark,
  sepia,
} as const;

export const highlights = {
  yellow: '#FFF59D',
  green: '#C8E6C9',
  blue: '#BBDEFB',
  pink: '#F8BBD0',
  purple: '#D1C4E9',
  orange: '#FFCC80',
} as const;
