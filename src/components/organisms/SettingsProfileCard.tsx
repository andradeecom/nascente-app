import { Pressable, View } from 'react-native';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { User, ChevronRight } from 'lucide-react-native';
import { Text, TEXT_VARIANTS, Avatar } from '@/components/atoms';

const ThemedUser = withUnistyles(User, (theme) => ({ color: theme.colors.semantic.accent }));
const ThemedChevronRight = withUnistyles(ChevronRight, (theme) => ({ color: theme.colors.semantic.textTertiary }));

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
          <ThemedUser size={24} />
        </View>
      )}
      <View style={styles.info}>
        <Text variant={TEXT_VARIANTS.BodyEmphasis}>{isAuthenticated ? name : title}</Text>
        <Text variant={TEXT_VARIANTS.Callout} color="textSecondary">
          {isAuthenticated ? email : subtitle}
        </Text>
      </View>
      <ThemedChevronRight size={18} />
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
  info: {
    flex: 1,
    gap: theme.spacing[0.5],
  },
}));
