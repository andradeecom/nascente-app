import { KeyboardAwareScrollView, type KeyboardAwareScrollViewProps } from 'react-native-keyboard-controller';

type KeyboardAwareScreenProps = KeyboardAwareScrollViewProps & {
  children: React.ReactNode;
};

/**
 * Reusable scrollable screen body that lifts the focused input above the
 * keyboard. Wraps `react-native-keyboard-controller`'s `KeyboardAwareScrollView`
 * (requires the root `KeyboardProvider`, mounted in `src/app/_layout.tsx`) with
 * the app's shared defaults so screens don't re-hand-roll `KeyboardAvoidingView`
 * + `ScrollView` + `Platform` branching:
 * - `keyboardShouldPersistTaps="handled"` so a tap on a button/link inside the
 *   form fires without first dismissing the keyboard.
 * - `bottomOffset` keeps a little breathing room between the input and keyboard.
 * - `keyboardDismissMode="interactive"` lets a drag pull the keyboard down.
 *
 * Pass `contentContainerStyle` for the screen's own centering/padding. Any other
 * `KeyboardAwareScrollView` prop is forwarded.
 */
export function KeyboardAwareScreen({ children, style, ...rest }: KeyboardAwareScreenProps) {
  return (
    <KeyboardAwareScrollView
      style={[flexFill, style]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      bottomOffset={24}
      showsVerticalScrollIndicator={false}
      {...rest}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}

// Plain (non-Unistyles) object — `KeyboardAwareScrollView` is Reanimated-based.
// Merging a Unistyles `styles.X` into its style array trips Reanimated 4.5's
// "empty object is not a valid style value" (the entry resolves to {} before the
// ShadowNode binding populates). See SplashScreen's `flexFill` + CLAUDE.md →
// Reanimated + Unistyles.
const flexFill = {
  flex: 1,
} as const;
