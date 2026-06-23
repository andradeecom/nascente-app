import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  // Onboarding screens render their own in-screen headers, not the navigator header.
  return <Stack screenOptions={{ headerShown: false }} />;
}
