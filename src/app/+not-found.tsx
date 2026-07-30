import { View } from 'react-native';
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles';
import { router } from 'expo-router';
import { Compass } from 'lucide-react-native';
import { Button, SafeAreaView, TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { BUTTON_SIZES, BUTTON_VARIANTS } from '@/components/atoms/Button';
import { useThemeStore } from '@/stores/theme';
import { useTranslate } from '@/i18n';

/**
 * Catch-all for any URL expo-router can't match — a mistyped in-app link, or a
 * deep link (custom scheme) with no matching route. Supabase auth-callback links
 * (signup confirm, password reset) resolve on their own screens instead — see
 * `src/lib/auth-link.ts` — this is only for links that don't reach a route at all.
 * Replaces expo-router's default unmatched-route page.
 */
export default function NotFoundScreen() {
  const t = useTranslate();
  const themeName = useThemeStore((s) => s.theme);
  const theme = UnistylesRuntime.getTheme(themeName);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.iconBadge}>
          <Compass size={32} color={theme.colors.semantic.accent} strokeWidth={2} />
        </View>
        <Text variant={TEXT_VARIANTS.Title2} style={styles.text}>
          {t('notFound.title')}
        </Text>
        <Text variant={TEXT_VARIANTS.Callout} color={TEXT_COLORS.TextSecondary} style={styles.text}>
          {t('notFound.description')}
        </Text>
        <Button
          label={t('notFound.action')}
          variant={BUTTON_VARIANTS.Primary}
          size={BUTTON_SIZES.Large}
          onPress={() => router.replace('/(tabs)')}
          style={styles.cta}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.semantic.bgPrimary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[6],
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.semantic.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[4],
  },
  text: {
    textAlign: 'center',
    marginBottom: theme.spacing[2],
  },
  cta: {
    marginTop: theme.spacing[4],
  },
}));
