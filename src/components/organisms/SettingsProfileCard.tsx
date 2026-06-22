import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { User, ChevronRight } from 'lucide-react-native';
import { Text, TextVariants, Avatar } from '@/components/atoms';

type SettingsProfileCardProps = {
  isAuthenticated: boolean;
  name?: string;
  email?: string;
  avatar?: string;
  title: string;
  subtitle: string;
  onPress: () => void;
};

export function SettingsProfileCard({
  isAuthenticated,
  name,
  email,
  avatar,
  title,
  subtitle,
  onPress,
}: SettingsProfileCardProps) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
      {isAuthenticated ? (
        <Avatar uri={avatar} fallback={name} size="md" />
      ) : (
        <View style={styles.iconContainer}>
          <User size={24} color={styles.icon.color} />
        </View>
      )}
      <View style={styles.info}>
        <Text variant={TextVariants.BodyEmphasis}>{isAuthenticated ? name : title}</Text>
        <Text variant={TextVariants.Callout} color="textSecondary">
          {isAuthenticated ? email : subtitle}
        </Text>
      </View>
      <ChevronRight size={18} color={styles.chevron.color} />
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
    backgroundColor: theme.colors.semantic.bgPrimary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing[4],
    ...theme.shadows.lg,
  },
  pressed: {
    opacity: 0.85,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.semantic.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    color: theme.colors.semantic.accent,
  },
  info: {
    flex: 1,
    gap: theme.spacing[0.5],
  },
  chevron: {
    color: theme.colors.semantic.textTertiary,
  },
}));
