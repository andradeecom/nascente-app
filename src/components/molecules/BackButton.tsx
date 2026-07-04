import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { ChevronLeft } from 'lucide-react-native';

const ThemedChevronLeft = withUnistyles(ChevronLeft, (theme) => ({ color: theme.colors.semantic.textPrimary }));

type BackButtonProps = {
  onPress?: () => void;
};

/**
 * Floating top-left back chevron for screens that center their own content (e.g.
 * the auth screens) and don't use the titled ScreenHeader. Renders nothing when
 * there's no history to pop, so it never shows as a dead control on a root route.
 */
export function BackButton({ onPress }: BackButtonProps) {
  const router = useRouter();

  if (!onPress && !router.canGoBack()) {
    return null;
  }

  const handlePress = onPress ?? (() => router.back());

  return (
    <Pressable onPress={handlePress} hitSlop={8} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <ThemedChevronLeft size={26} />
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  button: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing[2],
    marginTop: theme.spacing[2],
  },
  pressed: {
    opacity: 0.6,
  },
}));
