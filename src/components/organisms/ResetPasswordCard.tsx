import { useMemo, useState } from 'react';
import { Pressable } from 'react-native';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { useForm, Controller } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { Eye, EyeOff } from 'lucide-react-native';
import { Button, TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { Card, InputField } from '@/components/molecules';
import { createResetPasswordSchema, type ResetPasswordFormData } from '@/schemas/reset-password';
import { useTranslate } from '@/i18n';
import { BUTTON_SIZES, BUTTON_VARIANTS } from '../atoms/Button';

const ThemedEye = withUnistyles(Eye, (theme) => ({ color: theme.colors.semantic.textSecondary }));
const ThemedEyeOff = withUnistyles(EyeOff, (theme) => ({ color: theme.colors.semantic.textSecondary }));

type ResetPasswordCardProps = {
  onSubmit: (password: string) => void;
  isLoading?: boolean;
};

export function ResetPasswordCard({ onSubmit, isLoading }: ResetPasswordCardProps) {
  const t = useTranslate();
  const schema = useMemo(() => createResetPasswordSchema(), []);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const handleFormSubmit = (data: ResetPasswordFormData) => {
    onSubmit(data.password);
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
    <Card style={styles.card}>
      <Card.Header style={styles.header}>
        <Text variant={TEXT_VARIANTS.Title1} style={styles.title}>
          {t('resetPassword.title')}
        </Text>
        <Text variant={TEXT_VARIANTS.Callout} color={TEXT_COLORS.TextSecondary} style={styles.title}>
          {t('resetPassword.subtitle')}
        </Text>
      </Card.Header>

      <Card.Body style={styles.form}>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputField
              label={t('resetPassword.passwordLabel')}
              placeholder={t('resetPassword.passwordPlaceholder')}
              secureTextEntry={!isPasswordVisible}
              rightIcon={eyeIcon(isPasswordVisible, () => setIsPasswordVisible((prev) => !prev))}
              autoCapitalize="none"
              autoCorrect={false}
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
              label={t('resetPassword.confirmPasswordLabel')}
              placeholder={t('resetPassword.confirmPasswordPlaceholder')}
              secureTextEntry={!isConfirmPasswordVisible}
              rightIcon={eyeIcon(isConfirmPasswordVisible, () => setIsConfirmPasswordVisible((prev) => !prev))}
              autoCapitalize="none"
              autoCorrect={false}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmPassword?.message}
            />
          )}
        />

        <Button
          label={isLoading ? t('resetPassword.submitting') : t('resetPassword.submitButton')}
          variant={BUTTON_VARIANTS.Primary}
          size={BUTTON_SIZES.Large}
          fullWidth
          onPress={() => handleSubmit(handleFormSubmit)()}
          disabled={isLoading}
        />
      </Card.Body>
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.semantic.bgTertiary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing[6],
    gap: theme.spacing[6],
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
}));
