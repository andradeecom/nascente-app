import { Stack } from 'expo-router';

export default function SettingsLayout() {
  // Headers are rendered by the in-screen <ScreenHeader> component, not the navigator.
  return <Stack screenOptions={{ headerShown: false }} />;
}
