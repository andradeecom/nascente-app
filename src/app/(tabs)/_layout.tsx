import { ThemeProvider, DarkTheme, DefaultTheme } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { UnistylesRuntime } from 'react-native-unistyles';
import { useTranslate } from '@/i18n';
import { useThemeStore } from '@/stores/theme';

/**
 * Main bottom tabs, migrated to Expo Router's native tab bar (`NativeTabs`,
 * `expo-router/unstable-native-tabs`). On iOS this renders the system UIKit tab
 * bar and picks up the iOS 26 liquid-glass effect automatically; on Android it
 * renders the native Material tab bar. Icons are SF Symbols on iOS (`sf`) and
 * Material Symbols on Android (`md`) — the hand-drawn `TabIcons` SVG set is no
 * longer wired here.
 *
 * Theming (native tab bar is NOT a Unistyles surface):
 * - We subscribe to the theme name and read colors from the runtime so the
 *   tint/icon/label props recompute on a live theme switch (see CLAUDE.md).
 * - **`ThemeProvider` is the key to appearance.** The native tab bar follows the
 *   navigator's color scheme, NOT our Unistyles theme, and NOT necessarily the OS
 *   appearance. Without it, iOS 26 flashes a light background on tab changes and
 *   the glass can stick to the *system* light/dark even when the app is in a
 *   different theme (e.g. app in dark, phone in light → light tab bar). We wrap
 *   `NativeTabs` in expo-router's `ThemeProvider` driven by OUR theme (`dark` →
 *   `DarkTheme`; `light`/`sepia` → light) so the bar always matches the app.
 * - `backgroundColor` is set explicitly per theme so the bar's fill matches the
 *   app theme rather than relying on the system-glass light/dark inference.
 *
 * Requires a dev/standalone build (native module) — not available in Expo Go.
 */
export default function TabsLayout() {
  const translate = useTranslate();

  const themeName = useThemeStore((s) => s.theme);
  const { colors } = UnistylesRuntime.getTheme(themeName);
  const isDark = themeName === 'dark';

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <NativeTabs
        tintColor={colors.semantic.accent}
        iconColor={colors.semantic.textSecondary}
        labelStyle={{ color: colors.semantic.textSecondary }}
        backgroundColor={colors.semantic.bgPrimary}
        // Android's Material 3 active-tab indicator (the pill behind the selected
        // icon) defaults to a fixed light `secondaryContainer` color, ignoring our
        // theme — visibly wrong in dark/sepia. Theme it explicitly.
        indicatorColor={colors.semantic.accentSubtle}
        // Stop the tab bar going transparent at a scroll view's top edge. Without
        // this, iOS swaps between the standard and (transparent) scroll-edge
        // appearances as you change tabs / scroll — the visible "flashing".
        disableTransparentOnScrollEdge
        minimizeBehavior="onScrollDown"
        // The native tab bar's chrome (glass background + light/dark appearance)
        // follows the native UIKit trait, NOT our `ThemeProvider` and NOT the
        // `backgroundColor` prop — in expo-router 57 those aren't wired into the
        // iOS tab-bar appearance (it's stubbed), so the bar tracked the OS scheme
        // (app-in-dark + phone-in-light → light bar) and flickered. These two
        // host-level react-native-screens props ARE applied natively:
        //  - `colorScheme` forces the UITabBarController's trait to our theme
        //    (fixes the stuck-light-in-dark bar),
        //  - `nativeContainerStyle.backgroundColor` gives the bar an opaque
        //    themed fill (kills the transparent flash).
        // Reached via `unstable_nativeProps` (host-level TabsHostProps). See
        // CLAUDE.md → Native tabs.
        unstable_nativeProps={{
          colorScheme: isDark ? 'dark' : 'light',
          nativeContainerStyle: { backgroundColor: colors.semantic.bgPrimary },
        }}
      >
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label>{translate('tabs.home')}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="reader">
          <NativeTabs.Trigger.Label>{translate('tabs.reader')}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'book', selected: 'book.fill' }} md="menu_book" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="plans">
          <NativeTabs.Trigger.Label>{translate('tabs.plans')}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="study">
          <NativeTabs.Trigger.Label>{translate('tabs.study')}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'bookmark', selected: 'bookmark.fill' }} md="bookmark" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="settings">
          <NativeTabs.Trigger.Label>{translate('tabs.settings')}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="slider.horizontal.3" md="tune" />
        </NativeTabs.Trigger>
      </NativeTabs>
    </ThemeProvider>
  );
}
