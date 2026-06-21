import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import { withUnistyles } from 'react-native-unistyles';

/**
 * SafeAreaView from react-native-safe-area-context wraps a native component (not
 * RN's `View`), so the Unistyles Babel plugin can't make it theme-reactive on its
 * own — a themed `style={styles.safe}` on the raw SafeAreaView keeps its first-render
 * colors and won't repaint on theme change. `withUnistyles` subscribes the wrapped
 * component to the runtime so its themed styles update live. Screens import this
 * instead of the raw react-native-safe-area-context export.
 */
export const SafeAreaView = withUnistyles(RNSafeAreaView);
