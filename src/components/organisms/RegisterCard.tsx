import { useMemo, useState } from 'react';
import { Linking, Platform, Pressable, View } from 'react-native';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { useForm, Controller } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { Eye, EyeOff } from 'lucide-react-native';
import { Button, Divider, TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { Card, InputField, SocialButton } from '@/components/molecules';
import { createRegisterSchema, type RegisterFormData } from '@/schemas/register';
import { useTranslate } from '@/i18n';
import { BUTTON_SIZES, BUTTON_VARIANTS } from '../atoms/Button';
import { PROVIDERS } from '@/types/providers';

const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL || 'https://nascente.app/terms';
const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL || 'https://nascente.app/privacy';

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
    <Card style={styles.card}>
      <Card.Header style={styles.header}>
        <Text variant={TEXT_VARIANTS.Title2} style={styles.title}>
          {t('register.title')}
        </Text>
        <Text variant={TEXT_VARIANTS.Callout} color={TEXT_COLORS.TextSecondary}>
          {t('register.subtitle')}
        </Text>
      </Card.Header>

      <Card.Body style={styles.form}>
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
      </Card.Body>

      <Card.Footer style={styles.footer}>
        <Divider label={t('register.or')} />

        <View style={styles.socialButtons}>
          <SocialButton provider={PROVIDERS.Google} onPress={onRegisterWithGoogle} />
          {/* Sign in with Apple is iOS-native only (expo-apple-authentication throws on Android). */}
          {Platform.OS === 'ios' && <SocialButton provider={PROVIDERS.Apple} onPress={onRegisterWithApple} />}
        </View>

        <View style={styles.legalRow}>
          <Text variant={TEXT_VARIANTS.Caption} color={TEXT_COLORS.TextTertiary}>
            {t('register.legalPrefix')}
          </Text>
          <Pressable onPress={() => Linking.openURL(TERMS_URL)} hitSlop={8} accessibilityRole="button">
            <Text variant={TEXT_VARIANTS.Caption} color={TEXT_COLORS.TextSecondary} style={styles.legalLink}>
              {t('register.termsOfService')}
            </Text>
          </Pressable>
          <Text variant={TEXT_VARIANTS.Caption} color={TEXT_COLORS.TextTertiary}>
            {t('register.legalAnd')}
          </Text>
          <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} hitSlop={8} accessibilityRole="button">
            <Text variant={TEXT_VARIANTS.Caption} color={TEXT_COLORS.TextSecondary} style={styles.legalLink}>
              {t('register.privacyPolicy')}
            </Text>
          </Pressable>
        </View>
      </Card.Footer>
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
  nameRow: {
    flexDirection: 'row',
    gap: theme.spacing[3],
  },
  nameField: {
    flex: 1,
  },
  footer: {
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    gap: theme.spacing[4],
  },
  socialButtons: {
    gap: theme.spacing[3],
  },
  legalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing[1],
  },
  legalLink: {
    textDecorationLine: 'underline',
  },
}));
