import { ScrollView } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { SafeAreaView } from '@/components/atoms';
import { Globe, Palette, Type, Download, Bell, HelpCircle } from 'lucide-react-native';
import { SettingsProfileCard, SettingsList } from '@/components/organisms';
import { SettingsRow } from '@/components/molecules';
import { useAuthStore } from '@/stores/auth';
import { useTranslate } from '@/i18n';
import useSettingsScreen from './use-settings-screen';

export default function SettingsScreen() {
  const translate = useTranslate();
  const user = useAuthStore((s) => s.user);
  const {
    isAuthenticated,
    currentThemeLabel,
    currentLanguageLabel,
    currentTextSizeLabel,
    handleProfilePress,
    handleThemePress,
    handleLanguagePress,
    handleTextSizePress,
    handleSupportPress,
  } = useSettingsScreen();

  const fullName = user ? `${user.firstName} ${user.lastName}` : undefined;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <SettingsProfileCard
          isAuthenticated={isAuthenticated}
          name={fullName}
          email={user?.email}
          avatar={user?.profileImageUrl ?? undefined}
          title={translate('settings.createAccount')}
          subtitle={translate('settings.syncSubtitle')}
          onPress={handleProfilePress}
        />

        <SettingsList>
          <SettingsRow
            icon={<Globe size={20} color={styles.icon.color} />}
            label={translate('settings.language')}
            value={currentLanguageLabel}
            onPress={handleLanguagePress}
          />
          <SettingsRow
            icon={<Palette size={20} color={styles.icon.color} />}
            label={translate('settings.theme')}
            value={currentThemeLabel}
            onPress={handleThemePress}
          />
          <SettingsRow
            icon={<Type size={20} color={styles.icon.color} />}
            label={translate('settings.textSize')}
            value={currentTextSizeLabel}
            onPress={handleTextSizePress}
          />
          <SettingsRow
            icon={<Download size={20} color={styles.icon.color} />}
            label={translate('settings.downloads')}
            value="1"
            showChevron={false}
          />
          <SettingsRow
            icon={<Bell size={20} color={styles.icon.color} />}
            label={translate('settings.notifications')}
            value={translate('settings.notificationsEnabled')}
            showChevron={false}
          />
          <SettingsRow
            icon={<HelpCircle size={20} color={styles.icon.color} />}
            label={translate('settings.support')}
            onPress={handleSupportPress}
          />
        </SettingsList>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.semantic.bgSecondary,
  },
  scroll: {
    flexGrow: 1,
    gap: theme.spacing[5],
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[6],
  },
  icon: {
    color: theme.colors.semantic.accent,
  },
}));
