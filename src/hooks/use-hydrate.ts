import { useAuthStore } from '@/stores/auth';
import { useOnboardingStore } from '@/stores/onboarding';
import { useThemeStore } from '@/stores/theme';
import { useEffect } from 'react';

export function useHydrate() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isAuthHydrated = useAuthStore((s) => s.isHydrated);
  const isThemeHydrated = useThemeStore((s) => s.hasHydrated);
  const isOnboardingHydrated = useOnboardingStore((s) => s.hasHydrated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return isAuthHydrated && isThemeHydrated && isOnboardingHydrated;
}
