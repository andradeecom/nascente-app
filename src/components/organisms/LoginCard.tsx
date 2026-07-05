import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { useForm, Controller } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { Eye, EyeOff } from 'lucide-react-native';
import { Button, Divider, TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { InputField, SocialButton } from '@/components/molecules';
import { createLoginSchema, type LoginFormData } from '@/schemas/login';
import { useTranslate } from '@/i18n';
import { BUTTON_SIZES, BUTTON_VARIANTS } from '../atoms/Button';
import { PROVIDERS } from '@/types/providers';

const ThemedEye = withUnistyles(Eye, (theme) => ({ color: theme.colors.semantic.textSecondary }));
const ThemedEyeOff = withUnistyles(EyeOff, (theme) => ({ color: theme.colors.semantic.textSecondary }));

type LoginCardProps = {
  onLogin: (email: string, password: string) => void;
  onLoginWithGoogle: () => void;
  onLoginWithApple: () => void;
  onForgotPassword?: () => void;
  isLoading?: boolean;
};

export function LoginCard({
  onLogin,
  onLoginWithGoogle,
  onLoginWithApple,
  onForgotPassword,
  isLoading,
}: LoginCardProps) {
  const t = useTranslate();
  const schema = useMemo(() => createLoginSchema(), []);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (data: LoginFormData) => {
    onLogin(data.email, data.password);
  };

  function rightIcon() {
    return (
      <Pressable
        onPress={() => setIsPasswordVisible((prev) => !prev)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t(isPasswordVisible ? 'login.hidePassword' : 'login.showPassword')}
      >
        {isPasswordVisible ? <ThemedEyeOff size={20} /> : <ThemedEye size={20} />}
      </Pressable>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text variant={TEXT_VARIANTS.Title1} style={styles.title}>
          {t('login.title')}
        </Text>
        <Text variant={TEXT_VARIANTS.Callout} color={TEXT_COLORS.TextSecondary}>
          {t('login.subtitle')}
        </Text>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputField
              label={t('login.emailLabel')}
              placeholder={t('login.emailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputField
              label={t('login.passwordLabel')}
              rightLabel={t('login.forgotPassword')}
              onRightLabelPress={onForgotPassword}
              placeholder={t('login.passwordPlaceholder')}
              secureTextEntry={!isPasswordVisible}
              rightIcon={rightIcon()}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
            />
          )}
        />

        <Button
          label={isLoading ? t('login.signingIn') : t('login.loginButton')}
          variant={BUTTON_VARIANTS.Primary}
          size={BUTTON_SIZES.Large}
          fullWidth
          onPress={() => handleSubmit(onSubmit)()}
          disabled={isLoading}
        />
      </View>

      <Divider label={t('login.or')} />

      <View style={styles.socialButtons}>
        <SocialButton provider={PROVIDERS.Google} onPress={onLoginWithGoogle} />
        <SocialButton provider={PROVIDERS.Apple} onPress={onLoginWithApple} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.semantic.bgTertiary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing[6],
    gap: theme.spacing[6],
    ...theme.shadows.lg,
  },
  header: {
    alignItems: 'center',
    gap: theme.spacing[1],
  },
  title: {
    textAlign: 'center',
  },
  form: {
    gap: theme.spacing[4],
  },
  socialButtons: {
    gap: theme.spacing[3],
  },
}));
