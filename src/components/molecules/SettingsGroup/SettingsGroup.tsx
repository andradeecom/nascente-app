import type { SettingsGroupProps } from './SettingsGroup.types';

/**
 * Native grouped settings list (SwiftUI `Form` on iOS / Jetpack Compose on
 * Android). Real implementations live in `SettingsGroup.ios.tsx` /
 * `SettingsGroup.android.tsx`; Metro resolves the platform file at bundle time.
 * This base module exists only so TypeScript and web resolve `./SettingsGroup`
 * (there's no web target for native `@expo/ui`, so it renders nothing there).
 */
export function SettingsGroup(_props: SettingsGroupProps): React.ReactNode {
  return null;
}
