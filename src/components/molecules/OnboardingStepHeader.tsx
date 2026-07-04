import { Pressable, View } from 'react-native';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { ChevronLeft } from 'lucide-react-native';

const ThemedChevronLeft = withUnistyles(ChevronLeft, (theme) => ({ color: theme.colors.semantic.textPrimary }));

type OnboardingStepHeaderProps = {
  step: number;
  total: number;
  onBack?: () => void;
};

export function OnboardingStepHeader({ step, total, onBack }: OnboardingStepHeaderProps) {
  const stepIndex = step - 1;

  return (
    <View style={styles.container}>
      <Pressable style={styles.back} onPress={onBack} disabled={!onBack} accessibilityRole="button" hitSlop={8}>
        {onBack && <ThemedChevronLeft size={26} />}
      </Pressable>

      <View style={styles.dots}>
        {Array.from({ length: total }).map((_, index) => (
          <View
            key={index}
            style={[styles.dot, index === stepIndex && styles.dotActive, index < stepIndex && styles.dotDone]}
          />
        ))}
      </View>

      <View style={styles.back} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[2],
  },
  back: {
    width: 32,
    height: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1.5],
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.semantic.bgTertiary,
  },
  dotDone: {
    backgroundColor: theme.colors.semantic.accent,
  },
  dotActive: {
    width: 22,
    backgroundColor: theme.colors.semantic.accent,
  },
}));
