import { Slider as ExpoSlider } from '@expo/ui/community/slider';
import { UnistylesRuntime } from 'react-native-unistyles';
import { useThemeStore } from '@/stores/theme';

type SliderProps = {
  /** Number of discrete steps the thumb can snap to. */
  steps: number;
  /** Current step index (0-based, controlled). */
  value: number;
  /** Called with the new step index as the thumb is dragged or tapped. */
  onChange: (index: number) => void;
};

/**
 * A discrete-step slider, backed by Expo UI's **community** `Slider`
 * (`@expo/ui/community/slider`) — SwiftUI slider on iOS / Material 3 slider on
 * Android, giving a native (glass-on-iOS) look. We use the community drop-in
 * (not the universal `@expo/ui` `Slider`) because it **self-wraps in `<Host>`**;
 * the universal one renders a raw SwiftUI view and logs a "wrap with `<Host>`"
 * warning + fails to lay out.
 *
 * The atom keeps its original **step-index** API (`steps`/`value`/`onChange`)
 * so callers (`FontSizeSlider`, the AI-plan day count) are unchanged; internally
 * it maps to the numeric range as `minimumValue=0`, `maximumValue=steps-1`,
 * `step=1`. This replaced a hand-rolled Reanimated + gesture-handler slider that
 * broke on the Expo 57 / RN 0.86 worklets ABI change (see CLAUDE.md → Expo UI).
 *
 * Theming (not a Unistyles surface): the accent tint is read from the runtime by
 * subscribing to the theme name so it recomputes on a live theme switch.
 *
 * Native module → requires a dev/standalone build (not Expo Go).
 */
export function Slider({ steps, value, onChange }: SliderProps) {
  const themeName = useThemeStore((s) => s.theme);
  const { colors } = UnistylesRuntime.getTheme(themeName);

  const maximumValue = Math.max(0, steps - 1);

  return (
    <ExpoSlider
      value={value}
      minimumValue={0}
      maximumValue={maximumValue}
      step={1}
      minimumTrackTintColor={colors.semantic.accent}
      // Android maps this to the inactive track; without it Material fills the
      // rest of the track with a light-purple that clashes with the theme.
      maximumTrackTintColor={colors.semantic.bgTertiary}
      thumbTintColor={colors.semantic.accent}
      style={styles.slider}
      // Native slider can report fractional values mid-drag; round to the nearest
      // index and dedupe so `onChange` fires once per step.
      onValueChange={(v) => {
        const index = Math.round(v);
        if (index !== value) onChange(index);
      }}
    />
  );
}

const styles = { slider: { flex: 1 } } as const;
