import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { SafeAreaView } from '@/components/atoms';
import { Check } from 'lucide-react-native';
import { SettingsRow } from '@/components/molecules';
import { SettingsList, ScreenHeader } from '@/components/organisms';
import { useLocaleStore } from '@/stores/locale';
import { useTranslate } from '@/i18n';
import { LOCALE_OPTIONS, Locales } from '@/types';

const ThemedCheck = withUnistyles(Check, (theme) => ({ color: theme.colors.semantic.accent }));

export default function LanguageScreen() {
  const router = useRouter();
  const translate = useTranslate();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  const handleSelect = (code: Locales) => {
    setLocale(code);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={translate('settings.languageTitle')} />
      <View style={styles.container}>
        <SettingsList>
          {LOCALE_OPTIONS.map((option) => (
            <SettingsRow
              key={option}
              label={translate(`settings.languageOptions.${option}`)}
              showChevron={false}
              icon={option === locale ? <ThemedCheck size={20} /> : undefined}
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
}));
