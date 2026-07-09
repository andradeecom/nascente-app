import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore, THEME_OPTIONS, type ThemeName } from '@/stores/theme';
import { useLocaleStore } from '@/stores/locale';
import { useReaderStore } from '@/stores/reader';
import { i18n, useTranslate } from '@/i18n';
import { typography } from '@/theme/typography';
import { LOCALE_OPTIONS, type Locales } from '@/types';
import { Alert, Linking } from 'react-native';
import type { PickerOption } from '@/components/atoms';

export default function useSettingsScreen() {
  const router = useRouter();
  const translate = useTranslate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const fontSize = useReaderStore((s) => s.fontSize);

  // `locale` is null until the user picks one; fall back to the active i18n
  // locale (device-derived) so the picker reflects the language actually in use.
  const resolvedLocale: Locales = locale ?? LOCALE_OPTIONS.find((code) => i18n.locale.startsWith(code)) ?? 'en';

  const themeOptions: PickerOption<ThemeName>[] = THEME_OPTIONS.map((option) => ({
    value: option,
    label: translate(`settings.themeOptions.${option}`),
  }));

  const languageOptions: PickerOption<Locales>[] = LOCALE_OPTIONS.map((option) => ({
    value: option,
    label: translate(`settings.languageOptions.${option}`),
  }));

  const handleProfilePress = () => {
    if (!isAuthenticated) {
      router.push('/register');
      return;
    }
    router.push('/settings/profile');
  };

  const handleTextSizePress = () => {
    router.push('/settings/text-size');
  };

  const handleNotifications = () => {
    Alert.alert(translate('settings.notifications'), translate('settings.notificationsComingSoon'));
  };

  const handleCreditsPress = () => {
    router.push('/settings/credits');
  };

  const handleSupportPress = async () => {
    try {
      await Linking.openURL('mailto:support@nascente.app');
    } catch {
      Alert.alert(translate('settings.support'), translate('settings.supportEmail'));
    }
  };

  return {
    isAuthenticated,
    theme,
    setTheme,
    themeOptions,
    locale: resolvedLocale,
    setLocale,
    languageOptions,
    currentTextSizeLabel: `${typography.reader.sizes[fontSize]} pt`,
    handleProfilePress,
    handleTextSizePress,
    handleNotifications,
    handleCreditsPress,
    handleSupportPress,
  };
}
