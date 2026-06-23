import { useState } from 'react';
import { useRouter } from 'expo-router';
import { LOCALE_OPTIONS, useLocaleStore, type LocaleName } from '@/stores/locale';

export default function useOnboardingScreen() {
  const router = useRouter();
  const setLocale = useLocaleStore((s) => s.setLocale);
  const [selected, setSelected] = useState<LocaleName>(() => {
    const current = useLocaleStore.getState().locale;
    return LOCALE_OPTIONS.includes(current as LocaleName) ? (current as LocaleName) : 'pt';
  });

  const handleSelect = (locale: LocaleName) => {
    setSelected(locale);
    setLocale(locale);
  };

  const handleStart = () => {
    router.push('/onboarding/translation');
  };

  return {
    selected,
    languages: LOCALE_OPTIONS,
    handleSelect,
    handleStart,
  };
}
