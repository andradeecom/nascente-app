import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { translate } from '@/i18n';

export function LoginFooter() {
  return (
    <View style={styles.container}>
      <Text variant={TEXT_VARIANTS.Caption} color={TEXT_COLORS.TextSecondary}>
        {translate('login.privacyPolicy')}
      </Text>
      <Text variant={TEXT_VARIANTS.Caption} color={TEXT_COLORS.TextSecondary}>
        {translate('login.termsOfService')}
      </Text>
      <Text variant={TEXT_VARIANTS.Caption} color={TEXT_COLORS.TextSecondary}>
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
