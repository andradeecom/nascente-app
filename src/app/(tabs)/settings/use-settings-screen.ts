import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
import { useLocaleStore } from '@/stores/locale';
import { useReaderStore } from '@/stores/reader';
import { useTranslate } from '@/i18n';
import { typography } from '@/theme/typography';
import { Alert, Linking } from 'react-native';

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
    currentThemeLabel: translate(`settings.themeOptions.${theme}`),
    currentLanguageLabel: locale ? translate(`settings.languageOptions.${locale}`) : undefined,
    currentTextSizeLabel: `${typography.reader.sizes[fontSize]} pt`,
    handleProfilePress,
    handleThemePress,
    handleLanguagePress,
    handleTextSizePress,
    handleNotifications,
    handleCreditsPress,
    handleSupportPress,
  };
}
