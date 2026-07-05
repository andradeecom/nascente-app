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
};

export function ScreenHeader({ title, showBack = true, onBack }: ScreenHeaderProps) {
  const router = useRouter();
  const handleBack = onBack ?? (() => router.back());

  return (
    <View style={styles.row}>
      {showBack ? (
        <Pressable onPress={handleBack} hitSlop={8} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
          <ThemedChevronLeft size={26} />
        </Pressable>
      ) : (
        <View style={styles.back} />
      )}
      <Text variant={TEXT_VARIANTS.Title3} style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {/* Spacer mirrors the back button so the title stays centered. */}
      <View style={styles.back} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[3],
  },
  back: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
}));
