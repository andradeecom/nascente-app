import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, SafeAreaView } from '@/components/atoms';
import { useTranslate } from '@/i18n';

export default function ReaderScreen() {
  const translate = useTranslate();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text variant="title1">{translate('reader.title')}</Text>
        <Text variant="callout" color="textSecondary">
          {translate('reader.comingSoon')}
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
