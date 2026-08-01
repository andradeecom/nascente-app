import { View } from 'react-native';
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles';
import { PressableScale } from 'pressto';
import { Controller } from 'react-hook-form';
import { Camera } from 'lucide-react-native';
import { Avatar, Button, ProBadge, SafeAreaView, Switch, TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { InputField, KeyboardAwareScreen } from '@/components/molecules';
import { ChangePasswordModal, ScreenHeader } from '@/components/organisms';
import { BUTTON_SIZES, BUTTON_VARIANTS } from '@/components/atoms/Button';
import { hapticSelect } from '@/lib/haptics';
import { useThemeStore } from '@/stores/theme';
import { useTranslate } from '@/i18n';
import useProfileScreen from './use-profile-screen';

export default function ProfileScreen() {
  const t = useTranslate();
  const {
    user,
    isPro,
    fullName,
    avatarUri,
    isEditing,
    control,
    errors,
    isSaving,
    handleToggleMode,
    handlePickPhoto,
    handleSave,
    logout,
    isChangePasswordVisible,
    openChangePassword,
    closeChangePassword,
    handleChangePassword,
    isChangingPassword,
  } = useProfileScreen();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader
        title={t('settings.profileTitle')}
        right={
          user ? (
            <View style={styles.toggle}>
              <Text variant={TEXT_VARIANTS.Caption} color={TEXT_COLORS.TextSecondary}>
                {t('profile.editToggle')}
              </Text>
              <Switch value={isEditing} onValueChange={handleToggleMode} />
            </View>
          ) : undefined
        }
      />

      <KeyboardAwareScreen contentContainerStyle={styles.scroll}>
        <View style={styles.avatarBlock}>
          <View style={styles.avatarWrap}>
            <Avatar uri={avatarUri} fallback={fullName} size="xl" />
            {isEditing && <CameraBadge onPress={handlePickPhoto} accessibilityLabel={t('profile.changePhoto')} />}
          </View>
        </View>

        {isEditing ? (
          <View style={styles.form}>
            <Controller
              control={control}
              name="firstName"
              render={({ field: { onChange, onBlur, value } }) => (
                <InputField
                  label={t('profile.firstNameLabel')}
                  placeholder={t('profile.firstNamePlaceholder')}
                  autoCapitalize="words"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.firstName?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="lastName"
              render={({ field: { onChange, onBlur, value } }) => (
                <InputField
                  label={t('profile.lastNameLabel')}
                  placeholder={t('profile.lastNamePlaceholder')}
                  autoCapitalize="words"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.lastName?.message}
                />
              )}
            />
            {/* Email is display-only — changing it needs a re-confirmation flow (out of scope). */}
            <InputField
              label={t('profile.emailLabel')}
              value={user?.email ?? ''}
              editable={false}
              rightLabel={t('profile.emailLocked')}
            />

            <Button
              label={isSaving ? t('profile.saving') : t('profile.save')}
              variant={BUTTON_VARIANTS.Primary}
              size={BUTTON_SIZES.Large}
              fullWidth
              onPress={handleSave}
              disabled={isSaving}
              style={styles.saveButton}
            />
          </View>
        ) : (
          <View style={styles.viewBlock}>
            <View style={styles.nameRow}>
              <Text variant={TEXT_VARIANTS.Title3}>{fullName}</Text>
              {isPro && <ProBadge label={t('profile.proBadge')} />}
            </View>
            <Text variant={TEXT_VARIANTS.Callout} color={TEXT_COLORS.TextSecondary}>
              {user?.email ?? ''}
            </Text>
            {user && (
              <View style={styles.viewActions}>
                <Button
                  label={t('changePassword.entryLabel')}
                  variant={BUTTON_VARIANTS.Secondary}
                  fullWidth
                  onPress={openChangePassword}
                />
                <Button label={t('common.signOut')} variant={BUTTON_VARIANTS.Secondary} fullWidth onPress={logout} />
              </View>
            )}
          </View>
        )}
      </KeyboardAwareScreen>

      <ChangePasswordModal
        visible={isChangePasswordVisible}
        onClose={closeChangePassword}
        onSubmit={handleChangePassword}
        isLoading={isChangingPassword}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.semantic.bgSecondary,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[6],
    gap: theme.spacing[5],
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  avatarBlock: {
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
  },
  viewBlock: {
    alignItems: 'center',
    gap: theme.spacing[2],
    alignSelf: 'stretch',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  form: {
    alignSelf: 'stretch',
    gap: theme.spacing[4],
  },
  saveButton: {
    marginTop: theme.spacing[2],
  },
  viewActions: {
    alignSelf: 'stretch',
    gap: theme.spacing[3],
    marginTop: theme.spacing[6],
  },
}));

/**
 * The pressable camera badge overlapping the avatar's corner. A `PressableScale`
 * (pressto) for the press-scale animation + a selection haptic on tap, matching the
 * app's tappable-action conventions. Its style is built as a **plain** themed object
 * via `UnistylesRuntime.getTheme` (not a Unistyles `styles.X`) because a Unistyles
 * style on a Reanimated-based `PressableScale` trips the "empty object" error — see
 * CLAUDE.md → Reanimated + Unistyles. Read the theme name reactively so it repaints
 * on a live theme switch.
 */
function CameraBadge({ onPress, accessibilityLabel }: { onPress: () => void; accessibilityLabel: string }) {
  const themeName = useThemeStore((s) => s.theme);
  const theme = UnistylesRuntime.getTheme(themeName);
  const badgeStyle = {
    position: 'absolute' as const,
    right: 0,
    bottom: 0,
    width: theme.spacing[8],
    height: theme.spacing[8],
    borderRadius: theme.spacing[4],
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: theme.colors.semantic.accent,
    borderWidth: theme.spacing[0.5],
    borderColor: theme.colors.semantic.bgSecondary,
  };

  const handlePress = () => {
    hapticSelect();
    onPress();
  };

  return (
    <PressableScale
      onPress={handlePress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={badgeStyle}
    >
      <Camera size={16} color={theme.colors.semantic.bgPrimary} />
    </PressableScale>
  );
}
