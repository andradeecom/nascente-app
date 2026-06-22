import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
import { useLocaleStore } from '@/stores/locale';
import { useReaderStore } from '@/stores/reader';
import { useTranslate } from '@/i18n';
import { typography } from '@/theme/typography';

export default function useSettingsScreen() {
  const router = useRouter();
  const translate = useTranslate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const theme = useThemeStore((s) => s.theme);
  const locale = useLocaleStore((s) => s.locale);
  const fontSize = useReaderStore((s) => s.fontSize);

  const handleProfilePress = () => {
    if (!isAuthenticated) {
      router.push('/register');
      return;
    }
    router.push('/settings/profile');
  };

  const handleThemePress = () => {
    router.push('/settings/theme');
  };

  const handleLanguagePress = () => {
    router.push('/settings/language');
  };

  const handleTextSizePress = () => {
    router.push('/settings/text-size');
  };

  const handleSupportPress = () => {
    Toast.show({
      type: 'success',
      text1: translate('settings.supportToastTitle'),
      text2: translate('settings.supportToastMessage'),
    });
  };

  return {
    isAuthenticated,
    currentThemeLabel: translate(`settings.themeOptions.${theme}`),
    currentLanguageLabel: locale ? translate(`settings.languageOptions.${locale}`) : undefined,
    currentTextSizeLabel: `${typography.reader.sizes[fontSize]} pt`,
    handleProfilePress,
    handleThemePress,
    handleLanguagePress,
    handleTextSizePress,
    handleSupportPress,
  };
}
