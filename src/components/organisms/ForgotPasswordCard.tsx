import { useMemo } from 'react';
import { StyleSheet } from 'react-native-unistyles';
import { useForm, Controller } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { Button, TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { Card, InputField } from '@/components/molecules';
import { createForgotPasswordSchema, type ForgotPasswordFormData } from '@/schemas/forgot-password';
import { useTranslate } from '@/i18n';
import { BUTTON_SIZES, BUTTON_VARIANTS } from '../atoms/Button';

type ForgotPasswordCardProps = {
  onSubmit: (email: string) => void;
  isLoading?: boolean;
  isSubmitted?: boolean;
  submittedEmail?: string;
};

export function ForgotPasswordCard({ onSubmit, isLoading, isSubmitted, submittedEmail }: ForgotPasswordCardProps) {
  const t = useTranslate();
  const schema = useMemo(() => createForgotPasswordSchema(), []);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { email: '' },
  });

  const handleFormSubmit = (data: ForgotPasswordFormData) => {
    onSubmit(data.email);
  };

  if (isSubmitted) {
    return (
      <Card style={styles.card}>
        <Card.Header style={styles.header}>
          <Text variant={TEXT_VARIANTS.Title1} style={styles.title}>
            {t('forgotPassword.successTitle')}
          </Text>
          <Text variant={TEXT_VARIANTS.Callout} color={TEXT_COLORS.TextSecondary} style={styles.title}>
            {t('forgotPassword.successMessage', { email: submittedEmail ?? '' })}
          </Text>
        </Card.Header>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Card.Header style={styles.header}>
        <Text variant={TEXT_VARIANTS.Title1} style={styles.title}>
          {t('forgotPassword.title')}
        </Text>
        <Text variant={TEXT_VARIANTS.Callout} color={TEXT_COLORS.TextSecondary} style={styles.title}>
          {t('forgotPassword.subtitle')}
        </Text>
      </Card.Header>

      <Card.Body style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputField
              label={t('forgotPassword.emailLabel')}
              placeholder={t('forgotPassword.emailPlaceholder')}
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

        <Button
          label={isLoading ? t('forgotPassword.sending') : t('forgotPassword.submitButton')}
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
