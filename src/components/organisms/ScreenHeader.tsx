import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { ChevronLeft } from 'lucide-react-native';
import { Text, TEXT_VARIANTS } from '@/components/atoms';

const ThemedChevronLeft = withUnistyles(ChevronLeft, (theme) => ({ color: theme.colors.semantic.textPrimary }));

type ScreenHeaderProps = {
  title: string;
  /** Hide the back button (e.g. for a root screen that still wants the header). */
  showBack?: boolean;
  onBack?: () => void;
  /**
   * Optional content pinned to the top-right of the header (e.g. a mode toggle).
   * Sits in the slot that otherwise holds an invisible spacer mirroring the back
   * button, so the centered title stays centered.
   */
  right?: React.ReactNode;
};

export function ScreenHeader({ title, showBack = true, onBack, right }: ScreenHeaderProps) {
  const router = useRouter();
  const handleBack = onBack ?? (() => router.back());

  return (
    <View style={styles.row}>
      <View style={styles.backContainer}>
        {showBack ? (
          <Pressable onPress={handleBack} hitSlop={8} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
            <ThemedChevronLeft size={26} />
          </Pressable>
        ) : (
          <View style={styles.back} />
        )}
        <Text variant={TEXT_VARIANTS.Title3} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
      </View>
      {/* Right slot; falls back to a spacer mirroring the back button so the title stays centered. */}
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[3],
  },
  backContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
    maxWidth: '70%',
  },
  back: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: {
    minWidth: 40,
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
}));
