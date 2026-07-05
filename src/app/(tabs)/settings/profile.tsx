import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Avatar, Button, SafeAreaView, TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { ScreenHeader } from '@/components/organisms';
import { useAuthStore } from '@/stores/auth';
import { useLogout } from '@/hooks/use-auth';
import { useTranslate } from '@/i18n';
import { BUTTON_VARIANTS } from '@/components/atoms/Button';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const translate = useTranslate();

  const fullName = user ? `${user.firstName} ${user.lastName}` : 'Guest';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={translate('settings.profileTitle')} />
      <View style={styles.container}>
        <Avatar uri={user?.profileImageUrl ?? undefined} fallback={fullName} size="xl" />
        <Text variant={TEXT_VARIANTS.Title3}>{fullName}</Text>
        <Text variant={TEXT_VARIANTS.Callout} color={TEXT_COLORS.TextSecondary}>
          {user?.email ?? ''}
        </Text>
        {user && (
          <Button
            label={translate('common.signOut')}
            variant={BUTTON_VARIANTS.Secondary}
            fullWidth
            onPress={logout}
            style={styles.signOut}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.semantic.bgSecondary,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[2],
    paddingHorizontal: theme.spacing[5],
  },
  signOut: {
    marginTop: theme.spacing[6],
  },
}));
