import { Pressable, type PressableProps, type ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { FontAwesome } from '@expo/vector-icons';
import { Text, TEXT_VARIANTS } from '@/components/atoms';
import { translate } from '@/i18n';
import type { TxKeyPath } from '@/i18n';

type SocialProvider = 'google' | 'apple';

type SocialButtonProps = PressableProps & {
  provider: SocialProvider;
};

const LABEL_KEYS: Record<SocialProvider, TxKeyPath> = {
  google: 'login.continueWithGoogle',
  apple: 'login.continueWithApple',
};

const ICONS: Record<SocialProvider, React.ComponentProps<typeof FontAwesome>['name']> = {
  google: 'google',
  apple: 'apple',
};

export function SocialButton({ provider, style, ...rest }: SocialButtonProps) {
  return (
    <Pressable style={({ pressed }) => [styles.container, pressed && styles.pressed, style as ViewStyle]} {...rest}>
      <FontAwesome name={ICONS[provider]} size={18} color={styles.icon.color} />
      <Text variant={TEXT_VARIANTS.Label}>{translate(LABEL_KEYS[provider])}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.semantic.bgTertiary,
    backgroundColor: theme.colors.semantic.bgSecondary,
    gap: theme.spacing[2],
  },
  pressed: {
    opacity: 0.8,
    backgroundColor: theme.colors.semantic.bgTertiary,
  },
  icon: {
    color: theme.colors.semantic.textPrimary,
  },
}));
