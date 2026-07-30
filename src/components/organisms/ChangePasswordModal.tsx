import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { useForm, Controller } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { Eye, EyeOff } from 'lucide-react-native';
import { Button, TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { AppModal, InputField } from '@/components/molecules';
import { createResetPasswordSchema, type ResetPasswordFormData } from '@/schemas/reset-password';
import { useTranslate } from '@/i18n';
import { BUTTON_SIZES, BUTTON_VARIANTS } from '../atoms/Button';

const ThemedEye = withUnistyles(Eye, (theme) => ({ color: theme.colors.semantic.textSecondary }));
const ThemedEyeOff = withUnistyles(EyeOff, (theme) => ({ color: theme.colors.semantic.textSecondary }));

type ChangePasswordModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  isLoading?: boolean;
};

/**
 * Change-password dialog (built on `AppModal`), reached from the profile screen's
 * view mode. Reuses the reset-password schema/shape (new + confirm password) since
 * `supabase.auth.updateUser({ password })` — the call this feeds — doesn't require
 * the current password when the caller already holds a live session.
 */
export function ChangePasswordModal({ visible, onClose, onSubmit, isLoading }: ChangePasswordModalProps) {
  const t = useTranslate();
  const schema = useMemo(() => createResetPasswordSchema(), []);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const handleFormSubmit = (data: ResetPasswordFormData) => {
    onSubmit(data.password);
  };

  const handleClose = () => {
    reset({ password: '', confirmPassword: '' });
    onClose();
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
    <AppModal visible={visible} onClose={handleClose}>
      <View style={styles.content}>
        <Text variant={TEXT_VARIANTS.Title3} style={styles.title}>
          {t('changePassword.title')}
        </Text>
        <Text variant={TEXT_VARIANTS.Callout} color={TEXT_COLORS.TextSecondary} style={styles.subtitle}>
          {t('changePassword.subtitle')}
        </Text>

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
          label={isLoading ? t('resetPassword.submitting') : t('changePassword.submitButton')}
          variant={BUTTON_VARIANTS.Primary}
          size={BUTTON_SIZES.Large}
          fullWidth
          onPress={() => handleSubmit(handleFormSubmit)()}
          disabled={isLoading}
          style={styles.submit}
        />
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: {
    gap: theme.spacing[4],
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: theme.spacing[1],
  },
  submit: {
    marginTop: theme.spacing[2],
  },
}));
