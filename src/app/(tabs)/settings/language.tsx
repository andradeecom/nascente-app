import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';
import { SafeAreaView } from '@/components/atoms';
import { Check } from 'lucide-react-native';
import { SettingsRow } from '@/components/molecules';
import { SettingsList, ScreenHeader } from '@/components/organisms';
import { LOCALE_OPTIONS, useLocaleStore, type LocaleName } from '@/stores/locale';
import { useTranslate } from '@/i18n';

export default function LanguageScreen() {
  const router = useRouter();
  const translate = useTranslate();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  const handleSelect = (code: LocaleName) => {
    setLocale(code);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScreenHeader title={translate('settings.languageTitle')} />
      <View style={styles.container}>
        <SettingsList>
          {LOCALE_OPTIONS.map((option) => (
            <SettingsRow
              key={option}
              label={translate(`settings.languageOptions.${option}`)}
              showChevron={false}
              icon={option === locale ? <Check size={20} color={styles.check.color} /> : undefined}
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
