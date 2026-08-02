import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { hapticSelect } from '@/lib/haptics';
import { capture } from '@/lib/posthog';
import { useLocaleStore } from '@/stores/locale';
import { LOCALE_OPTIONS, Locales } from '@/types';

const DEFAULT_LOCALE: Locales = 'pt';

export default function useOnboardingScreen() {
  const router = useRouter();

  // This is the first onboarding screen, so its mount is the funnel's entry point.
  // Empty deps: fires once per mount of the flow, not on every language tap.
  useEffect(() => {
    capture('onboarding_started');
  }, []);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const [selected, setSelected] = useState<Locales>(() => {
    const current = useLocaleStore.getState().locale;
    return LOCALE_OPTIONS.includes(current as Locales) ? (current as Locales) : DEFAULT_LOCALE;
  });

  // Ensure the store/i18n actually reflect what the screen shows as selected,
  // even if the user proceeds without tapping any option.
  useEffect(() => {
    const current = useLocaleStore.getState().locale;
    if (current !== selected) {
      setLocale(selected);
    }
  }, [selected, setLocale]);

  const handleSelect = (locale: Locales) => {
    hapticSelect();
    setSelected(locale);
    setLocale(locale);
  };

  const handleStart = () => {
    capture('onboarding_step_completed', { step: 'language', step_index: 1 });
    router.push('/onboarding/translation');
  };

  return {
    selected,
    languages: LOCALE_OPTIONS,
    handleSelect,
    handleStart,
  };
}
