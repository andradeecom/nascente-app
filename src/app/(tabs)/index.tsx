import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { CalendarCheck } from 'lucide-react-native';
import { Text, SafeAreaView, TextVariants } from '@/components/atoms';
import {
  WelcomeHeader,
  VerseOfTheDayCard,
  ContinueReadingCard,
  StatsRow,
  ActivePlansSection,
  SignInPromptCard,
} from '@/components/organisms';
import { useHomeScreen } from '@/hooks/use-home-screen';

export default function HomeScreen() {
  const {
    translate,
    isAuthenticated,
    greetingKey,
    verseOfTheDay,
    verseText,
    bookName,
    chapter,
    translationLabel,
    stats,
    activePlans,
    handleContinueReading,
    handleVerseOfTheDay,
    handleExplorePlans,
    handleSignIn,
    handleOpenPlan,
  } = useHomeScreen();

  const statItems = useMemo(
    () => [
      { value: `${stats.progressPercent}%`, label: translate('home.progress') },
      { value: stats.streak, label: translate('home.streak') },
      { value: stats.highlightsCount, label: translate('home.highlights') },
    ],
    [stats, translate]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <WelcomeHeader greeting={translate(greetingKey)} subtitle={translate('home.subtitle')} />

        <VerseOfTheDayCard
          title={translate('home.verseOfTheDay')}
          verseText={verseText}
          reference={verseOfTheDay.ref}
          actionLabel={translate('home.readInContext')}
          onPress={handleVerseOfTheDay}
        />

        <ContinueReadingCard
          title={translate('home.continueReading')}
          bookName={bookName}
          chapter={chapter}
          translationLabel={translationLabel}
          progressPercent={8}
          onPress={handleContinueReading}
        />

        <StatsRow
          stats={statItems}
          locked={!isAuthenticated}
          caption={translate('home.statsSignIn')}
          onPress={handleSignIn}
        />

        {/* Guests can't have active plans (plans need an account), so the active-plans
            slot becomes a contextual sign-in prompt instead of a dead empty state. */}
        {isAuthenticated ? (
          <ActivePlansSection
            title={translate('home.activePlans')}
            exploreLabel={translate('home.explore')}
            emptyLabel={translate('home.noActivePlans')}
            nextLabel={translate('plans.next')}
            plans={activePlans.data ?? []}
            onExplore={handleExplorePlans}
            onPlanPress={handleOpenPlan}
          />
        ) : (
          <SignInPromptCard
            icon={CalendarCheck}
            title={translate('plans.signIn.title')}
            description={translate('plans.signIn.description')}
            actionLabel={translate('plans.signIn.action')}
            onPress={handleSignIn}
          />
        )}

        {/* ── Pro CTA ─────────────────────────────────────────────────────── */}
        {/* Hidden for guests — don't stack a paid upsell on top of the create-account
            nudge. TODO: also gate on subscription state once available (non-premium only). */}
        {isAuthenticated && (
          <Pressable style={({ pressed }) => [styles.proCard, pressed && styles.pressed]}>
            <View style={styles.proBadge}>
              <Text variant={TextVariants.Caption} style={styles.proBadgeText}>
                PRO
              </Text>
            </View>
            <Text variant={TextVariants.BodyEmphasis}>{translate('home.proTitle')}</Text>
            <Text variant={TextVariants.Callout} color="textSecondary">
              {translate('home.proDescription')}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.semantic.bgPrimary,
  },
  scroll: {
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[4],
    paddingBottom: theme.spacing[10],
    gap: theme.spacing[4],
  },
  pressed: {
    opacity: 0.85,
  },
  proCard: {
    backgroundColor: theme.colors.semantic.accentSubtle,
    borderRadius: theme.radius.xl,
    padding: theme.spacing[5],
    gap: theme.spacing[2],
  },
  proBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.semantic.accent,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[0.5],
  },
  proBadgeText: {
    color: '#FFFFFF',
    fontWeight: theme.font.weights.bold,
  },
}));
