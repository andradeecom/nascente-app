import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useForm, Controller } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, TextVariants, Button, Divider } from '@/components/atoms';
import { InputField, SocialButton } from '@/components/molecules';
import { createRegisterSchema, type RegisterFormData } from '@/schemas/register';
import { translate } from '@/i18n';

type RegisterCardProps = {
  onRegister: (data: { email: string; password: string; firstName: string; lastName: string }) => void;
  onRegisterWithGoogle: () => void;
  onRegisterWithApple: () => void;
  isLoading?: boolean;
};

export function RegisterCard({ onRegister, onRegisterWithGoogle, onRegisterWithApple, isLoading }: RegisterCardProps) {
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
        accessibilityLabel={translate(visible ? 'login.hidePassword' : 'login.showPassword')}
      >
        <MaterialCommunityIcons
          name={visible ? 'eye-off-outline' : 'eye-outline'}
          size={20}
          color={styles.eyeIcon.color}
        />
      </Pressable>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text variant={TextVariants.Title1} style={styles.title}>
          {translate('register.title')}
        </Text>
        <Text variant={TextVariants.Callout} color="textSecondary">
          {translate('register.subtitle')}
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
                  label={translate('register.firstNameLabel')}
                  placeholder={translate('register.firstNamePlaceholder')}
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
                  label={translate('register.lastNameLabel')}
                  placeholder={translate('register.lastNamePlaceholder')}
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
              label={translate('register.emailLabel')}
              placeholder={translate('register.emailPlaceholder')}
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
              label={translate('register.passwordLabel')}
              placeholder={translate('register.passwordPlaceholder')}
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
              label={translate('register.confirmPasswordLabel')}
              placeholder={translate('register.confirmPasswordPlaceholder')}
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
          label={isLoading ? translate('register.signingUp') : translate('register.registerButton')}
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => handleSubmit(onSubmit)()}
          disabled={isLoading}
        />
      </View>

      <Divider label={translate('register.or')} />

      <View style={styles.socialButtons}>
        <SocialButton provider="google" onPress={onRegisterWithGoogle} />
        <SocialButton provider="apple" onPress={onRegisterWithApple} />
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
  eyeIcon: {
    color: theme.colors.semantic.textSecondary,
  },
}));
