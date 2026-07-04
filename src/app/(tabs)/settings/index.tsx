import { ScrollView } from 'react-native';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { SafeAreaView } from '@/components/atoms';
import { Globe, Palette, Type, Bell, HelpCircle, FileText } from 'lucide-react-native';
import { SettingsProfileCard, SettingsList } from '@/components/organisms';
import { SettingsRow } from '@/components/molecules';
import { useAuthStore } from '@/stores/auth';
import { useTranslate } from '@/i18n';
import useSettingsScreen from './use-settings-screen';

const ThemedGlobe = withUnistyles(Globe, (theme) => ({ color: theme.colors.semantic.accent }));
const ThemedPalette = withUnistyles(Palette, (theme) => ({ color: theme.colors.semantic.accent }));
const ThemedType = withUnistyles(Type, (theme) => ({ color: theme.colors.semantic.accent }));
const ThemedBell = withUnistyles(Bell, (theme) => ({ color: theme.colors.semantic.accent }));
const ThemedFileText = withUnistyles(FileText, (theme) => ({ color: theme.colors.semantic.accent }));
const ThemedHelpCircle = withUnistyles(HelpCircle, (theme) => ({ color: theme.colors.semantic.accent }));

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
    handleNotifications,
    handleCreditsPress,
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
            icon={<ThemedGlobe size={20} />}
            label={translate('settings.language')}
            value={currentLanguageLabel}
            onPress={handleLanguagePress}
          />
          <SettingsRow
            icon={<ThemedPalette size={20} />}
            label={translate('settings.theme')}
            value={currentThemeLabel}
            onPress={handleThemePress}
          />
          <SettingsRow
            icon={<ThemedType size={20} />}
            label={translate('settings.textSize')}
            value={currentTextSizeLabel}
            onPress={handleTextSizePress}
          />
          <SettingsRow
            icon={<ThemedBell size={20} />}
            label={translate('settings.notifications')}
            onPress={handleNotifications}
          />
          <SettingsRow
            icon={<ThemedFileText size={20} />}
            label={translate('settings.credits.row')}
            onPress={handleCreditsPress}
          />
          <SettingsRow
            icon={<ThemedHelpCircle size={20} />}
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
}));
