import { Host, Switch as ExpoSwitch } from '@expo/ui';
import { UnistylesRuntime } from 'react-native-unistyles';
import { useThemeStore } from '@/stores/theme';

type SwitchProps = {
  /** Whether the switch is on. */
  value: boolean;
  /** Called with the new value when the user toggles the switch. */
  onValueChange: (value: boolean) => void;
  /** Whether the switch is disabled (no interaction). */
  disabled?: boolean;
};

/**
 * A native toggle, backed by Expo UI's universal `Switch` (`@expo/ui`) — SwiftUI
 * `Toggle` on iOS (picks up the glass look) / Material `Switch` on Android.
 *
 * Unlike the community drop-ins used by `Slider`/`SegmentedControl`, the universal
 * `Switch` does **not** self-wrap in a `<Host>`, so we wrap it here (once, at the
 * atom boundary) — a bare universal control renders a raw native view and fails to
 * lay out. `matchContents` sizes the Host to the switch so it can sit inline in a
 * header row.
 *
 * Theming (not a Unistyles surface): the Host's `colorScheme` (forced from the app
 * theme so it doesn't follow the OS) + `seedColor` (accent, which iOS applies as the
 * SwiftUI tint / Android derives the Material palette from) are read from the runtime
 * by subscribing to the theme name, so they recompute on a live theme switch — same
 * caveat as `SettingsGroup`/`SegmentedControl` (see CLAUDE.md → Expo UI).
 *
 * Native module → requires a dev/standalone build (not Expo Go).
 */
export function Switch({ value, onValueChange, disabled }: SwitchProps) {
  const themeName = useThemeStore((s) => s.theme);
  const { colors } = UnistylesRuntime.getTheme(themeName);

  return (
    <Host matchContents colorScheme={themeName === 'dark' ? 'dark' : 'light'} seedColor={colors.semantic.accent}>
      <ExpoSwitch value={value} onValueChange={onValueChange} disabled={disabled} />
    </Host>
  );
}
