import { useMemo } from 'react';
import { ScrollView } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { CalendarCheck } from 'lucide-react-native';
import { SafeAreaView } from '@/components/atoms';
import {
  WelcomeHeader,
  VerseOfTheDayCard,
  ContinueReadingCard,
  StatsRow,
  ActivePlansSection,
  SignInPromptCard,
  ProCtaCard,
} from '@/components/organisms';
import { useHomeScreen } from '@/hooks/use-home-screen';

export default function HomeScreen() {
  const {
    translate,
    isAuthenticated,
    showProCta,
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
    handleOpenPaywall,
  } = useHomeScreen();

  const statItems = useMemo(
    () => [
      { value: `${stats.progressPercent}%`, label: translate('home.progress') },
      { value: stats.streak, label: translate('home.streak') },
      // Highlights are account-gated (Study tab); guests see a muted placeholder.
      isAuthenticated
        ? { value: stats.highlightCount, label: translate('home.highlights') }
        : { value: '—', label: translate('home.highlights'), muted: true },
    ],
    [stats, isAuthenticated, translate]
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

        <StatsRow stats={statItems} />

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
        {showProCta && (
          <ProCtaCard
            badgeLabel="PRO"
            title={translate('home.proTitle')}
            description={translate('home.proDescription')}
            onPress={handleOpenPaywall}
          />
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
}));
