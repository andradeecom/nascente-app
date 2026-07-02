export const LOCALE_OPTIONS = ['pt', 'es', 'en'] as const;
export type Locales = (typeof LOCALE_OPTIONS)[number];
