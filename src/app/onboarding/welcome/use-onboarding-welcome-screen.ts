import { useRouter } from 'expo-router';
import { useOnboardingStore } from '@/stores/onboarding';
import { capture } from '@/lib/posthog';

export default function useOnboardingWelcomeScreen() {
  const router = useRouter();
  const complete = useOnboardingStore((s) => s.complete);

  const handleStartReading = () => {
    // `complete()` is called only here, so this is the true end of the funnel —
    // install → activated. Pairs with `onboarding_started` on the first step.
    capture('onboarding_completed', { entry: 'read' });
    complete();
    router.replace('/(tabs)');
  };

  return {
    handleStartReading,
  };
}
