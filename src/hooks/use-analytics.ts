import { useEffect } from 'react';
import { usePathname } from 'expo-router';
import { registerSuperProperties, screen } from '@/lib/posthog';
import { useAuthStore } from '@/stores/auth';
import { useLocaleStore } from '@/stores/locale';
import { useReaderStore } from '@/stores/reader';
import { useThemeStore } from '@/stores/theme';
import { useIsPro } from '@/hooks/use-profile';
import { i18n } from '@/i18n/i18n';

/**
 * Headless analytics wiring — screen views + the global super properties. Mounted
 * once in `src/app/_layout.tsx` alongside `useSync()`; renders nothing.
 *
 * **Screen tracking is manual, and must stay that way.** PostHog's `captureScreens`
 * autocapture doesn't support `@react-navigation/native` v7+ (this app is on 7.3.5
 * via expo-router), so it's disabled at the provider and screens are captured here.
 *
 * **Why `usePathname()` and not a per-screen mount effect:** `NativeTabs` keeps
 * every tab screen mounted in the background for instant switching, so a
 * mount/data-ready `useEffect` fires for tabs the user has never looked at — the
 * exact bug that made the tour-guide spotlight appear on the wrong tab (see
 * CLAUDE.md → "Mount-gated triggers MUST also gate on useIsFocused"). `usePathname`
 * changes only on real navigation, so one effect here is both correct and complete,
 * with no per-screen instrumentation and no `useIsFocused` gating to forget.
 */

/**
 * Collapse dynamic route segments so screen names group in PostHog instead of
 * fragmenting into one entry per id (`/plans/9f3a…` → `/plans/[planId]`). Plan ids
 * are uuids for enrollments and slugs for curated plans, so match the position in
 * the path rather than the id's shape.
 */
function normalizeScreenName(pathname: string): string {
  return pathname.replace(/^\/plans\/(?!create$)[^/]+/, '/plans/[planId]');
}

export function useAnalytics(): void {
  const pathname = usePathname();

  const isPro = useIsPro();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const locale = useLocaleStore((s) => s.locale);
  const translationId = useReaderStore((s) => s.translationId);
  const theme = useThemeStore((s) => s.theme);

  // Super properties ride along on every subsequent event, so register them
  // before the first screen view rather than after (effects run in order).
  useEffect(() => {
    registerSuperProperties({
      is_pro: isPro,
      is_authenticated: isAuthenticated,
      // `locale` is null until the user makes an explicit choice; fall back to the
      // device-derived locale that i18n is actually rendering in.
      app_locale: locale ?? i18n.locale,
      translation_id: translationId,
      theme,
    });
  }, [isPro, isAuthenticated, locale, translationId, theme]);

  useEffect(() => {
    if (!pathname) return;
    screen(normalizeScreenName(pathname));
  }, [pathname]);
}
