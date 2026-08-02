import { useRouter } from 'expo-router';
import { capture } from '@/lib/posthog';

export default function useOnboardingAccountScreen() {
  const router = useRouter();

  const handleCreateAccount = () => {
    capture('onboarding_step_completed', { step: 'account', step_index: 4 });
    capture('onboarding_account_choice', { choice: 'register' });
    router.push('/onboarding/account/register');
  };

  // "Usar sem conta" — the guest path. Capturing the choice here is what makes the
  // guest-first bet measurable (how many people decline an account up front).
  const handleSkip = () => {
    capture('onboarding_step_completed', { step: 'account', step_index: 4 });
    capture('onboarding_account_choice', { choice: 'guest' });
    router.push('/onboarding/welcome');
  };
  const handleBack = () => router.back();

  return {
    handleCreateAccount,
    handleSkip,
    handleBack,
  };
}
