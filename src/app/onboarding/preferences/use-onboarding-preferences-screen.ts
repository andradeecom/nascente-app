import { useRouter } from 'expo-router';
import { THEME_OPTIONS, useThemeStore, type ThemeName } from '@/stores/theme';
import { FONT_SIZE_OPTIONS, useReaderStore } from '@/stores/reader';
import { typography } from '@/theme/typography';

export default function useOnboardingPreferencesScreen() {
  const router = useRouter();
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const fontSize = useReaderStore((s) => s.fontSize);
  const setFontSize = useReaderStore((s) => s.setFontSize);

  const fontSizeIndex = Math.max(0, FONT_SIZE_OPTIONS.indexOf(fontSize));
  const fontSizePt = typography.reader.sizes[fontSize];
  const fontLineHeight = fontSizePt * typography.reader.lineHeightMultipliers[fontSize];

  const handleSelectTheme = (name: ThemeName) => setTheme(name);

  const handleSelectFontSize = (index: number) => {
    const next = FONT_SIZE_OPTIONS[index];
    if (next) setFontSize(next);
  };

  const handleFinish = () => {
    router.push('/onboarding/account');
  };

  const handleBack = () => router.back();

  return {
    theme,
    themeOptions: THEME_OPTIONS,
    fontSizeIndex,
    fontSizeSteps: FONT_SIZE_OPTIONS.length,
    fontSizePt,
    fontLineHeight,
    handleSelectTheme,
    handleSelectFontSize,
    handleFinish,
    handleBack,
  };
}
