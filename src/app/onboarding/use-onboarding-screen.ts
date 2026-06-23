import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useLocaleStore, type LocaleName } from '@/stores/locale';

const LANGUAGE_ORDER: LocaleName[] = ['pt', 'es', 'en'];

export default function useOnboardingScreen() {
  const router = useRouter();
  const setLocale = useLocaleStore((s) => s.setLocale);
  const [selected, setSelected] = useState<LocaleName>(() => {
    const current = useLocaleStore.getState().locale;
    return LANGUAGE_ORDER.includes(current as LocaleName) ? (current as LocaleName) : 'pt';
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
    languages: LANGUAGE_ORDER,
    handleSelect,
    handleStart,
  };
}
