import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { useForm, Controller } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { Eye, EyeOff } from 'lucide-react-native';
import { Button, Divider, TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { InputField, SocialButton } from '@/components/molecules';
import { createRegisterSchema, type RegisterFormData } from '@/schemas/register';
import { useTranslate } from '@/i18n';
import { BUTTON_SIZES, BUTTON_VARIANTS } from '../atoms/Button';
import { PROVIDERS } from '@/types/providers';

const ThemedEye = withUnistyles(Eye, (theme) => ({ color: theme.colors.semantic.textSecondary }));
const ThemedEyeOff = withUnistyles(EyeOff, (theme) => ({ color: theme.colors.semantic.textSecondary }));

type RegisterCardProps = {
  onRegister: (data: { email: string; password: string; firstName: string; lastName: string }) => void;
  onRegisterWithGoogle: () => void;
  onRegisterWithApple: () => void;
  isLoading?: boolean;
};

export function RegisterCard({ onRegister, onRegisterWithGoogle, onRegisterWithApple, isLoading }: RegisterCardProps) {
  const t = useTranslate();
  const schema = useMemo(() => createRegisterSchema(), []);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = (data: RegisterFormData) => {
    onRegister({ email: data.email, password: data.password, firstName: data.firstName, lastName: data.lastName });
  };

  function eyeIcon(visible: boolean, onToggle: () => void) {
    return (
      <Pressable
        onPress={onToggle}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t(visible ? 'login.hidePassword' : 'login.showPassword')}
      >
        {visible ? <ThemedEyeOff size={20} /> : <ThemedEye size={20} />}
      </Pressable>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text variant={TEXT_VARIANTS.Title1} style={styles.title}>
          {t('register.title')}
        </Text>
        <Text variant={TEXT_VARIANTS.Callout} color={TEXT_COLORS.TextSecondary}>
          {t('register.subtitle')}
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.nameRow}>
          <View style={styles.nameField}>
            <Controller
              control={control}
              name="firstName"
              render={({ field: { onChange, onBlur, value } }) => (
                <InputField
                  label={t('register.firstNameLabel')}
                  placeholder={t('register.firstNamePlaceholder')}
                  autoCapitalize="words"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.firstName?.message}
                />
              )}
            />
          </View>
          <View style={styles.nameField}>
            <Controller
              control={control}
              name="lastName"
              render={({ field: { onChange, onBlur, value } }) => (
                <InputField
                  label={t('register.lastNameLabel')}
                  placeholder={t('register.lastNamePlaceholder')}
                  autoCapitalize="words"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.lastName?.message}
                />
              )}
            />
          </View>
        </View>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputField
              label={t('register.emailLabel')}
              placeholder={t('register.emailPlaceholder')}
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
              label={t('register.passwordLabel')}
              placeholder={t('register.passwordPlaceholder')}
              secureTextEntry={!isPasswordVisible}
              rightIcon={eyeIcon(isPasswordVisible, () => setIsPasswordVisible((prev) => !prev))}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputField
              label={t('register.confirmPasswordLabel')}
              placeholder={t('register.confirmPasswordPlaceholder')}
              secureTextEntry={!isConfirmPasswordVisible}
              rightIcon={eyeIcon(isConfirmPasswordVisible, () => setIsConfirmPasswordVisible((prev) => !prev))}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmPassword?.message}
            />
          )}
        />

        <Button
          label={isLoading ? t('register.signingUp') : t('register.registerButton')}
          variant={BUTTON_VARIANTS.Primary}
          size={BUTTON_SIZES.Large}
          fullWidth
          onPress={() => handleSubmit(onSubmit)()}
          disabled={isLoading}
        />
      </View>

      <Divider label={t('register.or')} />

      <View style={styles.socialButtons}>
        <SocialButton provider={PROVIDERS.Google} onPress={onRegisterWithGoogle} />
        <SocialButton provider={PROVIDERS.Apple} onPress={onRegisterWithApple} />
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
  nameRow: {
    flexDirection: 'row',
    gap: theme.spacing[3],
  },
  nameField: {
    flex: 1,
  },
  socialButtons: {
    gap: theme.spacing[3],
  },
}));
