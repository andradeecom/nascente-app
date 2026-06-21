import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, SafeAreaView } from '@/components/atoms';
import { useAuthStore } from '@/stores/auth';
import { useTranslate } from '@/i18n';

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const translate = useTranslate();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text variant="title1">{translate('home.greeting', { name: user?.firstName ?? 'Guest' })}</Text>
        <Text variant="callout" color="textSecondary">
          {translate('home.welcomeBack')}
        </Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[5],
    gap: theme.spacing[2],
  },
}));
