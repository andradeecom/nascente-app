import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useLocaleStore, type LocaleName } from '@/stores/locale';
import { useOnboardingStore } from '@/stores/onboarding';

const LANGUAGE_ORDER: LocaleName[] = ['pt', 'es', 'en'];

export default function useOnboardingScreen() {
  const router = useRouter();
  const setLocale = useLocaleStore((s) => s.setLocale);
  const complete = useOnboardingStore((s) => s.complete);
  const [selected, setSelected] = useState<LocaleName>(() => {
    const current = useLocaleStore.getState().locale;
    return LANGUAGE_ORDER.includes(current as LocaleName) ? (current as LocaleName) : 'pt';
  });

  const handleSelect = (locale: LocaleName) => {
    setSelected(locale);
    setLocale(locale);
  };

  const handleStart = () => {
    complete();
    router.replace('/login');
  };

  return {
    selected,
    languages: LANGUAGE_ORDER,
    handleSelect,
    handleStart,
  };
}
