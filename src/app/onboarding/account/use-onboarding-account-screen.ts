import { useRouter } from 'expo-router';

export default function useOnboardingAccountScreen() {
  const router = useRouter();

  const handleCreateAccount = () => router.push('/onboarding/account/register');
  const handleSkip = () => router.push('/onboarding/welcome');
  const handleBack = () => router.back();

  return {
    handleCreateAccount,
    handleSkip,
    handleBack,
  };
}
