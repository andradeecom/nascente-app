import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Highlighter } from 'lucide-react-native';
import { SafeAreaView, Text, TextVariants } from '@/components/atoms';
import { SignInPromptCard } from '@/components/organisms';
import { highlights as HIGHLIGHT_HEX } from '@/theme/colors';
import useStudyScreen from './use-study-screen';

export default function StudyScreen() {
  const { translate, isAuthenticated, highlights, isLoading, isError, handleSignIn, handleOpenHighlight } =
    useStudyScreen();

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text variant={TextVariants.Title1} style={styles.heading}>
          {translate('study.title')}
        </Text>

        {!isAuthenticated ? (
          <SignInPromptCard
            icon={Highlighter}
            title={translate('study.signIn.title')}
            description={translate('study.signIn.description')}
            actionLabel={translate('study.signIn.action')}
            onPress={handleSignIn}
          />
        ) : isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={styles.accent.color} />
          </View>
        ) : isError ? (
          <Text variant={TextVariants.Callout} color="textSecondary">
            {translate('study.loadError')}
          </Text>
        ) : highlights.length === 0 ? (
          <Text variant={TextVariants.Callout} color="textSecondary" style={styles.empty}>
            {translate('study.empty')}
          </Text>
        ) : (
          <View style={styles.list}>
            {highlights.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => handleOpenHighlight(item)}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <View style={[styles.colorDot, { backgroundColor: HIGHLIGHT_HEX[item.color] }]} />
                <View style={styles.cardBody}>
                  <Text variant={TextVariants.Label} color="accent">
                    {item.reference}
                  </Text>
                  <Text variant={TextVariants.Callout} color="textSecondary" numberOfLines={3}>
                    {item.text}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.semantic.bgSecondary,
  },
  content: {
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[3],
    paddingBottom: theme.spacing[8],
    gap: theme.spacing[4],
  },
  heading: {
    marginBottom: theme.spacing[2],
  },
  centered: {
    paddingTop: theme.spacing[10],
    alignItems: 'center',
  },
  accent: {
    color: theme.colors.semantic.accent,
  },
  empty: {
    marginTop: theme.spacing[2],
  },
  list: {
    gap: theme.spacing[3],
  },
  card: {
    flexDirection: 'row',
    gap: theme.spacing[3],
    backgroundColor: theme.colors.semantic.bgPrimary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing[4],
    ...theme.shadows.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: theme.radius.full,
    marginTop: 4,
  },
  cardBody: {
    flex: 1,
    gap: theme.spacing[1],
  },
}));
