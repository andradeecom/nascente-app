import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';
import { SafeAreaView } from '@/components/atoms';
import { Check } from 'lucide-react-native';
import { SettingsRow } from '@/components/molecules';
import { SettingsList, ScreenHeader } from '@/components/organisms';
import { useThemeStore, type ThemeName } from '@/stores/theme';
import { useTranslate } from '@/i18n';

const THEME_OPTIONS: ThemeName[] = ['light', 'dark', 'sepia'];

export default function ThemeScreen() {
  const router = useRouter();
  const translate = useTranslate();
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  const handleSelect = (name: ThemeName) => {
    setTheme(name);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScreenHeader title={translate('settings.themeTitle')} />
      <View style={styles.container}>
        <SettingsList>
          {THEME_OPTIONS.map((option) => (
            <SettingsRow
              key={option}
              label={translate(`settings.themeOptions.${option}`)}
              showChevron={false}
              icon={option === theme ? <Check size={20} color={styles.check.color} /> : undefined}
              onPress={() => handleSelect(option)}
            />
          ))}
        </SettingsList>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.semantic.bgSecondary,
  },
  container: {
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[6],
  },
  check: {
    color: theme.colors.semantic.accent,
  },
}));
