import { useAppleLogin, useGoogleLogin, useLogin, useMockLogin } from '@/hooks/use-auth';
import { translate } from '@/i18n';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

export default function useLoginScreen() {
  const router = useRouter();
  const loginMutation = useLogin();
  const googleLoginMutation = useGoogleLogin();
  const appleLoginMutation = useAppleLogin();
  const mockLogin = useMockLogin();

  // This screen is reached from settings (guest sign-in), pushed on top of the
  // (tabs) stack. Auth no longer swaps the navigator, so dismiss the pushed auth
  // screens to return to settings (origin) where the profile card now shows the user.
  // `dismissTo` (not `dismissAll`) because login/register both live inside the
  // (auth) group's own nested Stack — `dismissAll`'s POP_TO_TOP targets whichever
  // stack is currently focused, so navigating login <-> register only pops within
  // the nested (auth) stack instead of all the way back to (tabs). `dismissTo`
  // targets the actual route, regardless of nesting depth.
  const goToApp = () => {
    if (router.canDismiss()) {
      router.dismissTo('/(tabs)/settings');
    } else {
      router.replace('/(tabs)/settings');
    }
  };

  const handleLogin = (email: string, password: string) => {
    loginMutation.mutate(
      { email, password },
      {
        onSuccess: goToApp,
        onError: (error) => {
          Toast.show({
            type: 'error',
            text1: translate('errors.loginFailed'),
            text2: error instanceof Error ? error.message : translate('errors.invalidCredentials'),
          });
        },
      }
    );
  };

  const handleGoogleLogin = () => {
    googleLoginMutation.mutate(undefined, {
      onSuccess: goToApp,
      onError: (error) => {
        if (error instanceof Error && error.message === 'Google sign-in was cancelled') {
          return;
        }
        console.log('Google login error:', error);
        Toast.show({
          type: 'error',
          text1: translate('errors.loginFailed'),
          text2: error instanceof Error ? error.message : translate('errors.invalidCredentials'),
        });
      },
    });
  };

  const handleAppleLogin = () => {
    appleLoginMutation.mutate(undefined, {
      onSuccess: goToApp,
      onError: (error) => {
        // Apple surfaces a user cancel as code ERR_REQUEST_CANCELED — swallow it
        // (no error toast) the same way the Google flow ignores its cancel case.
        if (error instanceof Error && 'code' in error && error.code === 'ERR_REQUEST_CANCELED') {
          return;
        }
        console.log('Apple login error:', error);
        Toast.show({
          type: 'error',
          text1: translate('errors.loginFailed'),
          text2: error instanceof Error ? error.message : translate('errors.invalidCredentials'),
        });
      },
    });
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

  const handleMockLogin = () => {
    mockLogin();
    goToApp();
  };

  return {
    handleLogin,
    handleGoogleLogin,
    handleAppleLogin,
    handleForgotPassword,
    mockLogin: handleMockLogin,
    isLoading: loginMutation.isPending,
  };
}
