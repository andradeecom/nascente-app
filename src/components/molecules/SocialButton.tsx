import { Pressable, type PressableProps, type ViewStyle } from 'react-native';
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles';
import { GoogleIcon, AppleIcon, Text, TEXT_VARIANTS } from '@/components/atoms';
import { useThemeStore } from '@/stores/theme';
import { translate } from '@/i18n';
import type { TxKeyPath } from '@/i18n';
import { PROVIDERS, Providers } from '@/types/providers';

type SocialButtonProps = PressableProps & {
  provider: Providers;
};

const LABEL_KEYS: Record<Providers, TxKeyPath> = {
  [PROVIDERS.Google]: 'login.continueWithGoogle',
  [PROVIDERS.Apple]: 'login.continueWithApple',
};

export function SocialButton({ provider, style, ...rest }: SocialButtonProps) {
  // AppleIcon's color follows the current text color, so it needs the reactive theme
  // (see the Reanimated/PressableScale note elsewhere) — GoogleIcon is brand-fixed.
  const themeName = useThemeStore((s) => s.theme);
  const theme = UnistylesRuntime.getTheme(themeName);

  return (
    <Pressable style={({ pressed }) => [styles.container, pressed && styles.pressed, style as ViewStyle]} {...rest}>
      {provider === PROVIDERS.Google ? (
        <GoogleIcon size={16} />
      ) : (
        <AppleIcon size={20} color={theme.colors.semantic.textPrimary} />
      )}
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
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.semantic.bgTertiary,
    backgroundColor: theme.colors.semantic.bgSecondary,
    gap: theme.spacing[2],
  },
  pressed: {
    opacity: 0.8,
    backgroundColor: theme.colors.semantic.bgTertiary,
  },
}));
