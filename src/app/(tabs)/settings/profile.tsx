import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, Avatar, Button, SafeAreaView } from '@/components/atoms';
import { ScreenHeader } from '@/components/organisms';
import { useAuthStore } from '@/stores/auth';
import { useLogout } from '@/hooks/use-auth';
import { useTranslate } from '@/i18n';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const translate = useTranslate();

  const fullName = user ? `${user.firstName} ${user.lastName}` : 'Guest';

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScreenHeader title={translate('settings.profileTitle')} />
      <View style={styles.container}>
        <Avatar uri={user?.profileImageUrl ?? undefined} fallback={fullName} size="xl" />
        <Text variant="title3">{fullName}</Text>
        <Text variant="callout" color="textSecondary">
          {user?.email ?? ''}
        </Text>
        <Button
          label={translate('common.signOut')}
          variant="secondary"
          fullWidth
          onPress={logout}
          style={styles.signOut}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.semantic.bgPrimary,
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
