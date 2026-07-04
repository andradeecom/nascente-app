import { View } from 'react-native';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { BookOpen } from 'lucide-react-native';
import { Text, TEXT_VARIANTS } from '@/components/atoms';

const ThemedBookOpen = withUnistyles(BookOpen, (theme) => ({ color: theme.colors.semantic.accent }));

type WelcomeHeaderProps = {
  greeting: string;
  subtitle: string;
};

export function WelcomeHeader({ greeting, subtitle }: WelcomeHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.icon}>
        <ThemedBookOpen size={24} strokeWidth={2} />
      </View>
      <View>
        <Text variant={TEXT_VARIANTS.Title1}>{greeting}</Text>
        <Text variant={TEXT_VARIANTS.Callout} color="textSecondary">
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.semantic.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
