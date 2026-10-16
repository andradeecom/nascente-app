import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as NativeSplash from 'expo-splash-screen';
import { getLocales } from 'expo-localization';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from '@/navigator/root-navigator';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { PressablesConfig } from 'pressto';
import { TourGuideProvider, TourGuideOverlay } from '@wrack/react-native-tour-guide';
import { PostHogProvider, PostHogErrorBoundary } from 'posthog-react-native';
import { queryClient } from '@/lib/query-client';
import { configureRevenueCat } from '@/lib/revenuecat';
import { configurePostHog, getPostHogClient } from '@/lib/posthog';
import { i18n } from '@/i18n';

i18n.locale = getLocales()[0]?.languageTag || 'pt';
i18n.enableFallback = true;

// Configure RevenueCat once, before any offerings/purchase call. No-ops without a
// platform API key (Expo Go / no key) so the app still boots. User identity is
// bound separately from the auth lifecycle (see src/stores/auth.ts).
configureRevenueCat();

// Same contract as RevenueCat above: configure once at module scope, no-op without
// an API key so the app boots analytics-free. Identity is bound from the auth
// lifecycle (see src/stores/auth.ts), never here.
configurePostHog();

// Keep the native splash visible until JS loads and the app has hydrated.
NativeSplash.preventAutoHideAsync();
NativeSplash.setOptions({ duration: 300, fade: true });

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
              {/*
                `client` (not `apiKey`) hands the provider the same singleton the
                non-component call sites use (`@/lib/posthog`), so `usePostHog()`
                and a `capture()` from a Zustand store are the one instance.

                `autocapture={false}` disables BOTH captureTouches and
                captureScreens. Touches are off by decision (named events only —
                generic $autocapture would also risk capturing note/verse text via
                element labels); screens are captured manually in `useAnalytics`
                because captureScreens doesn't support React Navigation v7+.
              */}
              <PostHogProvider client={getPostHogClient() ?? undefined} autocapture={false}>
                <PostHogErrorBoundary>
                  <TourGuideProvider>
                    <RootNavigator />
                    <ToastWithInsets />
                    <TourGuideOverlay />
                  </TourGuideProvider>
                </PostHogErrorBoundary>
              </PostHogProvider>
            </QueryClientProvider>
          </PressablesConfig>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
