export const typography = {
  reader: {
    families: {
      // Reference variable fonts by their real family name (name ID 1) so the
      // `wght` axis is driven by fontWeight. Addressing them by PostScript name
      // (e.g. 'Literata-Regular') pins them to the 400 static instance and makes
      // RN synthesize bogus names like `Literata-Regular_Medium`, dropping weights.
      serif: 'Literata',
      serifAlt: 'Source Serif 4',
      sans: 'Lato',
      dyslexic: 'OpenDyslexic',
    },
    sizes: {
      small: 16,
      medium: 18,
      large: 20,
      xl: 22,
    },
    lineHeightMultipliers: {
      small: 1.55,
      medium: 1.6,
      large: 1.65,
      xl: 1.7,
    },
  },
} as const;
