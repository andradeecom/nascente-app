import { useMemo } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useForm, Controller } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { Text, TextVariants, Button } from '@/components/atoms';
import { InputField } from '@/components/molecules';
import { createForgotPasswordSchema, type ForgotPasswordFormData } from '@/schemas/forgot-password';
import { translate } from '@/i18n';

type ForgotPasswordCardProps = {
  onSubmit: (email: string) => void;
  isLoading?: boolean;
  isSubmitted?: boolean;
  submittedEmail?: string;
};

export function ForgotPasswordCard({ onSubmit, isLoading, isSubmitted, submittedEmail }: ForgotPasswordCardProps) {
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
      <View style={styles.card}>
        <View style={styles.header}>
          <Text variant={TextVariants.Title1} style={styles.title}>
            {translate('forgotPassword.successTitle')}
          </Text>
          <Text variant={TextVariants.Callout} color="textSecondary" style={styles.title}>
            {translate('forgotPassword.successMessage', { email: submittedEmail ?? '' })}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text variant={TextVariants.Title1} style={styles.title}>
          {translate('forgotPassword.title')}
        </Text>
        <Text variant={TextVariants.Callout} color="textSecondary" style={styles.title}>
          {translate('forgotPassword.subtitle')}
        </Text>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputField
              label={translate('forgotPassword.emailLabel')}
              placeholder={translate('forgotPassword.emailPlaceholder')}
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
          label={isLoading ? translate('forgotPassword.sending') : translate('forgotPassword.submitButton')}
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleSubmit(handleFormSubmit)}
          disabled={isLoading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.semantic.bgPrimary,
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
}));
