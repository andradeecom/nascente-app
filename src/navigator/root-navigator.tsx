import { useEffect, useState } from 'react';
import { Stack, ThemeProvider, DarkTheme, DefaultTheme } from 'expo-router';
import * as NativeSplash from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useAnalytics, useSync } from '@/hooks';
import { useAuthStore } from '@/stores/auth';
import { useOnboardingStore } from '@/stores/onboarding';
import { SplashScreen } from '@/components/organisms';
import { useThemeStore } from '@/stores/theme';

// Flip to true during development to force the onboarding flow on every launch.
const FORCE_ONBOARDING = __DEV__ && false;

function useHydrate() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isAuthHydrated = useAuthStore((s) => s.isHydrated);
  const isThemeHydrated = useThemeStore((s) => s.hasHydrated);
  const isOnboardingHydrated = useOnboardingStore((s) => s.hasHydrated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return isAuthHydrated && isThemeHydrated && isOnboardingHydrated;
}

export function RootNavigator() {
  const isHydrated = useHydrate();
  // Mirror local-first user data (study tools + reading-progress) to Supabase
  // when signed in + online. Headless and self-gating — a no-op for guests.
  useSync();
  // Screen views + analytics super properties. Headless; no-ops without a key.
  useAnalytics();
  const hasCompletedOnboarding = useOnboardingStore((s) => s.hasCompleted);
  const themeName = useThemeStore((s) => s.theme);
  const [splashDone, setSplashDone] = useState(false);
  const shouldShowOnboarding = FORCE_ONBOARDING || !hasCompletedOnboarding;
  // Hold on the native splash (no JS render) until resources are ready.
  if (!isHydrated) {
    return null;
  }
  // Hand off to the animated splash, hiding the native one once it's laid out.
  if (!splashDone) {
    return <SplashScreen onReady={() => NativeSplash.hideAsync()} onFinish={() => setSplashDone(true)} />;
  }
  // Keep every screen in a single Stack and let Protected guards decide which is
  // reachable — swapping the whole Stack tree confuses Expo Router's persisted
  // navigation state, which is why onboarding only appeared on the very first run.
  //
  // `ThemeProvider` drives the *native navigator's* color scheme from our app
  // theme (`dark` → DarkTheme; `light`/`sepia` → light). Without it the native
  // surfaces (the NativeTabs bar, screen transition backgrounds) default to a
  // light scheme regardless of the app theme — causing the white flash on tab
  // changes and the tab bar sticking to light in dark mode. It's set here (root)
  // so every transition is covered, and also inside `(tabs)/_layout` for the bar.
  return (
    <ThemeProvider value={themeName === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={themeName === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={shouldShowOnboarding}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Protected guard={!shouldShowOnboarding}>
          {/* Guests can use the app without an account; login/register stay reachable (e.g. from settings). */}
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          {/* Pro paywall — pushed from any tier-gated CTA, presented as a modal. */}
          <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
