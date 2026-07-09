import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { SafeAreaView } from '@/components/atoms';
import { SettingsProfileCard } from '@/components/organisms';
import { SettingsGroup, type SettingsGroupSection } from '@/components/molecules';
import { useAuthStore } from '@/stores/auth';
import { useTranslate } from '@/i18n';
import useSettingsScreen from './use-settings-screen';

export default function SettingsScreen() {
  const translate = useTranslate();
  const user = useAuthStore((s) => s.user);
  const {
    isAuthenticated,
    theme,
    setTheme,
    themeOptions,
    locale,
    setLocale,
    languageOptions,
    currentTextSizeLabel,
    handleProfilePress,
    handleTextSizePress,
    handleNotifications,
    handleCreditsPress,
    handleSupportPress,
  } = useSettingsScreen();

  const fullName = user ? `${user.firstName} ${user.lastName}` : undefined;

  const sections: SettingsGroupSection[] = [
    {
      key: 'preferences',
      items: [
        {
          type: 'picker',
          key: 'language',
          label: translate('settings.language'),
          options: languageOptions,
          selectedValue: locale,
          onValueChange: (value) => setLocale(value as typeof locale),
        },
        {
          type: 'picker',
          key: 'theme',
          label: translate('settings.theme'),
          options: themeOptions,
          selectedValue: theme,
          onValueChange: (value) => setTheme(value as typeof theme),
        },
      ],
    },
    {
      key: 'general',
      items: [
        {
          type: 'nav',
          key: 'textSize',
          label: translate('settings.textSize'),
          value: currentTextSizeLabel,
          onPress: handleTextSizePress,
        },
        { type: 'nav', key: 'notifications', label: translate('settings.notifications'), onPress: handleNotifications },
        { type: 'nav', key: 'credits', label: translate('settings.credits.row'), onPress: handleCreditsPress },
        { type: 'nav', key: 'support', label: translate('settings.support'), onPress: handleSupportPress },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <SettingsProfileCard
          isAuthenticated={isAuthenticated}
          name={fullName}
          email={user?.email}
          avatar={user?.profileImageUrl ?? undefined}
          title={translate('settings.createAccount')}
          subtitle={translate('settings.syncSubtitle')}
          onPress={handleProfilePress}
        />
      </View>

      {/* Native grouped list (SwiftUI Form / Compose) fills the rest of the screen. */}
      <SettingsGroup sections={sections} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.semantic.bgSecondary,
  },
  header: {
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[6],
    paddingBottom: theme.spacing[2],
  },
}));
