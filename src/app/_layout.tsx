import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as NativeSplash from 'expo-splash-screen';
import { SplashScreen } from '@/components/organisms';
import { QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
import { getLocales } from 'expo-localization';
import { i18n } from '@/i18n';

i18n.locale = getLocales()[0]?.languageTag || 'en';
i18n.enableFallback = true;

// Keep the native splash visible until JS loads and the app has hydrated.
NativeSplash.preventAutoHideAsync();
NativeSplash.setOptions({ duration: 300, fade: true });

function useHydrate() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isAuthHydrated = useAuthStore((s) => s.isHydrated);
  const isThemeHydrated = useThemeStore((s) => s.hasHydrated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return isAuthHydrated && isThemeHydrated;
}

function RootNavigator() {
  const isHydrated = useHydrate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [splashDone, setSplashDone] = useState(false);

  // Hold on the native splash (no JS render) until resources are ready.
  if (!isHydrated) {
    return null;
  }

  // Hand off to the animated splash, hiding the native one once it's laid out.
  if (!splashDone) {
    return <SplashScreen onReady={() => NativeSplash.hideAsync()} onFinish={() => setSplashDone(true)} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const insets = useSafeAreaInsets();

  return (
    <QueryClientProvider client={queryClient}>
      <RootNavigator />
      <Toast topOffset={insets.top} />
    </QueryClientProvider>
  );
}
