import { useRouter } from 'expo-router';
import { useOnboardingStore } from '@/stores/onboarding';

export default function useOnboardingWelcomeScreen() {
  const router = useRouter();
  const complete = useOnboardingStore((s) => s.complete);

  const handleStartReading = () => {
    complete();
    router.replace('/(tabs)');
  };

  return {
    handleStartReading,
  };
}
