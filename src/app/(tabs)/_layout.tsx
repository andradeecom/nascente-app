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
 * Theming caveat (same as the old JS tab bar): the native tab bar is NOT a
 * Unistyles surface, so its colors don't repaint on a live theme switch on their
 * own. We subscribe to the theme name and read colors from the runtime so these
 * props recompute when the theme changes — mirroring the pattern the old
 * `Tabs`/`Stack` `screenOptions` used (see CLAUDE.md, "Native tabs").
 *
 * We deliberately leave `backgroundColor` unset on light/dark so iOS liquid
 * glass renders (it auto-adapts light/dark). The custom `sepia` theme is not
 * something glass can infer, so we set an explicit opaque background only then.
 *
 * Requires a dev/standalone build (native module) — not available in Expo Go.
 */
export default function TabsLayout() {
  const translate = useTranslate();

  const themeName = useThemeStore((s) => s.theme);
  const { colors } = UnistylesRuntime.getTheme(themeName);

  return (
    <NativeTabs
      tintColor={colors.semantic.accent}
      iconColor={colors.semantic.textSecondary}
      labelStyle={{ color: colors.semantic.textSecondary }}
      // Sepia isn't a light/dark variant glass can infer — give it an opaque
      // themed background; leave light/dark to the system glass.
      backgroundColor={themeName === 'sepia' ? colors.semantic.bgPrimary : undefined}
      minimizeBehavior="onScrollDown"
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
  );
}
