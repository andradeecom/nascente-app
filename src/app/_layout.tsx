import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as NativeSplash from 'expo-splash-screen';
import { SplashScreen } from '@/components/organisms';
import { QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { PressablesConfig } from 'pressto';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
import { useOnboardingStore } from '@/stores/onboarding';
import { useSync } from '@/hooks/use-sync';
import { getLocales } from 'expo-localization';
import { i18n } from '@/i18n';
import { configureRevenueCat } from '@/lib/revenuecat';

i18n.locale = getLocales()[0]?.languageTag || 'en';
i18n.enableFallback = true;

// Configure RevenueCat once, before any offerings/purchase call. No-ops without a
// platform API key (Expo Go / no key) so the app still boots. User identity is
// bound separately from the auth lifecycle (see src/stores/auth.ts).
configureRevenueCat();

// Keep the native splash visible until JS loads and the app has hydrated.
NativeSplash.preventAutoHideAsync();
NativeSplash.setOptions({ duration: 300, fade: true });

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

function RootNavigator() {
  const isHydrated = useHydrate();
  // Mirror local-first user data (study tools + reading-progress) to Supabase
  // when signed in + online. Headless and self-gating — a no-op for guests.
  useSync();
  const hasCompletedOnboarding = useOnboardingStore((s) => s.hasCompleted);
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
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={shouldShowOnboarding}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={!shouldShowOnboarding}>
        {/* Guests can use the app without an account; login/register stay reachable (e.g. from settings). */}
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
        {/* Pro paywall — pushed from any tier-gated CTA, presented as a modal. */}
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
      </Stack.Protected>
    </Stack>
  );
}

// Toast reads safe-area insets, which resolve asynchronously after native
// measurement. Kept as its own component *inside* SafeAreaProvider so that
// async inset update re-renders only this, not the whole root tree — a state
// update on the root during its initial mount is what triggered React's
// "state update on a component that hasn't mounted yet" warning on device.
function ToastWithInsets() {
  const insets = useSafeAreaInsets();
  return <Toast topOffset={insets.top} />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <PressablesConfig animationType="spring" config={{ minScale: 0.97 }}>
            <QueryClientProvider client={queryClient}>
              <RootNavigator />
              <ToastWithInsets />
            </QueryClientProvider>
          </PressablesConfig>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
