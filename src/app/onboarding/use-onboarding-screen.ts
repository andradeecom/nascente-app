import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useLocaleStore } from '@/stores/locale';
import { LOCALE_OPTIONS, Locales } from '@/types';

export default function useOnboardingScreen() {
  const router = useRouter();
  const setLocale = useLocaleStore((s) => s.setLocale);
  const [selected, setSelected] = useState<Locales>(() => {
    const current = useLocaleStore.getState().locale;
    return LOCALE_OPTIONS.includes(current as Locales) ? (current as Locales) : 'pt';
  });

  const handleSelect = (locale: Locales) => {
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
