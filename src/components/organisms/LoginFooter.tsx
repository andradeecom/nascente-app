import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, TEXT_VARIANTS } from '@/components/atoms';
import { translate } from '@/i18n';

export function LoginFooter() {
  return (
    <View style={styles.container}>
      <Text variant={TEXT_VARIANTS.Caption} color="textSecondary">
        {translate('login.privacyPolicy')}
      </Text>
      <Text variant={TEXT_VARIANTS.Caption} color="textSecondary">
        {translate('login.termsOfService')}
      </Text>
      <Text variant={TEXT_VARIANTS.Caption} color="textSecondary">
        {translate('login.support')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing[5],
    paddingVertical: theme.spacing[4],
  },
}));
