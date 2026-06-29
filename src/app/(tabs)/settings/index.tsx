import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';
import { SafeAreaView } from '@/components/atoms';
import { Globe, Palette, Type, BookOpen, Bell, HelpCircle, FileText } from 'lucide-react-native';
import { SettingsProfileCard, SettingsList } from '@/components/organisms';
import { SettingsRow } from '@/components/molecules';
import { useAuthStore } from '@/stores/auth';
import { useIsPro } from '@/hooks/use-profile';
import { FREE_TRANSLATIONS, PRO_TRANSLATIONS } from '@/types/bible';
import { useTranslate } from '@/i18n';
import useSettingsScreen from './use-settings-screen';

export default function SettingsScreen() {
  const translate = useTranslate();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isPro = useIsPro();
  // Everything's bundled; "unlocked" = free always, plus Pro translations when subscribed.
  const unlockedTranslations = FREE_TRANSLATIONS.length + (isPro ? PRO_TRANSLATIONS.length : 0);
  const {
    isAuthenticated,
    currentThemeLabel,
    currentLanguageLabel,
    currentTextSizeLabel,
    handleProfilePress,
    handleThemePress,
    handleLanguagePress,
    handleTextSizePress,
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
            icon={<BookOpen size={20} color={styles.icon.color} />}
            label={translate('settings.translations')}
            // Pro users: show how many are unlocked. Free users: nudge to unlock the rest.
            value={isPro ? `${unlockedTranslations}` : translate('settings.translationsUnlockPro')}
            showChevron={!isPro}
            onPress={isPro ? undefined : () => router.push('/paywall')}
          />
          <SettingsRow
            icon={<Bell size={20} color={styles.icon.color} />}
            label={translate('settings.notifications')}
            value={translate('settings.notificationsEnabled')}
            showChevron={false}
          />
          <SettingsRow
            icon={<FileText size={20} color={styles.icon.color} />}
            label={translate('settings.credits.row')}
            onPress={handleCreditsPress}
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
