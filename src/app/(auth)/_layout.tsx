import { Stack } from 'expo-router';

export default function AuthLayout() {
  // Headers are rendered by the in-screen <BackButton>, not the navigator.
  return <Stack screenOptions={{ headerShown: false }} />;
}
