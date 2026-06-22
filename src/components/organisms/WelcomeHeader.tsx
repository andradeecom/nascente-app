import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { BookOpen } from 'lucide-react-native';
import { Text, TextVariants } from '@/components/atoms';

type WelcomeHeaderProps = {
  greeting: string;
  subtitle: string;
};

export function WelcomeHeader({ greeting, subtitle }: WelcomeHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.icon}>
        <BookOpen size={24} color={styles.iconColor.color} strokeWidth={2} />
      </View>
      <View>
        <Text variant={TextVariants.Title1}>{greeting}</Text>
        <Text variant={TextVariants.Callout} color="textSecondary">
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
  iconColor: {
    color: theme.colors.semantic.accent,
  },
}));
