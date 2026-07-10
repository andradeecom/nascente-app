import { SegmentedControl as ExpoSegmentedControl } from '@expo/ui/community/segmented-control';
import { UnistylesRuntime } from 'react-native-unistyles';
import { hapticSelect } from '@/lib/haptics';
import { useThemeStore } from '@/stores/theme';

export type Segment<T extends string> = {
  key: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  segments: Segment<T>[];
  value: T;
  onChange: (key: T) => void;
};

/**
 * A native segmented control, backed by Expo UI's community drop-in
 * (`@expo/ui/community/segmented-control`) — SwiftUI segmented `Picker` on iOS
 * (picks up the glass look) and Jetpack Compose `SingleChoiceSegmentedButtonRow`
 * on Android. Kept generic over the segment key type so callers get a typed
 * `onChange`; the native control speaks index/string, so we map key ⇄ index here.
 *
 * This replaced a hand-rolled Reanimated sliding-thumb implementation that broke
 * on the Expo 57 / RN 0.86 worklets ABI change (see CLAUDE.md → Expo UI). Call
 * sites (`StudyScreen` filter, `AiExplainSheet` mode toggle) are unchanged.
 *
 * Theming caveat (not a Unistyles surface): iOS ignores `tintColor` and follows
 * the system light/dark — we pass an explicit `appearance` derived from the app
 * theme (subscribed via the theme name so it recomputes on a live switch) so the
 * control matches the app's theme, including sepia (→ light). `tintColor` sets
 * the accent on Android/web.
 *
 * Native module → requires a dev/standalone build (not Expo Go).
 */
export function SegmentedControl<T extends string>({ segments, value, onChange }: SegmentedControlProps<T>) {
  const themeName = useThemeStore((s) => s.theme);
  const { colors } = UnistylesRuntime.getTheme(themeName);

  const values = segments.map((s) => s.label);
  const selectedIndex = Math.max(
    0,
    segments.findIndex((s) => s.key === value)
  );

  return (
    <ExpoSegmentedControl
      values={values}
      selectedIndex={selectedIndex}
      appearance={themeName === 'dark' ? 'dark' : 'light'}
      tintColor={colors.semantic.accentSubtle}
      onChange={(e) => {
        const index = e.nativeEvent.selectedSegmentIndex;
        const segment = segments[index];
        if (segment && segment.key !== value) {
          hapticSelect();
          onChange(segment.key);
        }
      }}
    />
  );
}
