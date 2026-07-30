import { ResetPasswordCard } from '@/components/organisms';
import { StyleSheet } from 'react-native-unistyles';
import { SafeAreaView } from '@/components/atoms';
import { KeyboardAwareScreen } from '@/components/molecules';
import useResetPasswordScreen from './use-reset-password-screen';

export default function ResetPasswordScreen() {
  const { handleSubmit, isLoading } = useResetPasswordScreen();

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAwareScreen contentContainerStyle={styles.scroll}>
        <ResetPasswordCard onSubmit={handleSubmit} isLoading={isLoading} />
      </KeyboardAwareScreen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.semantic.bgPrimary,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[6],
  },
}));
