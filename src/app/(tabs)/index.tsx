import { useMemo } from 'react';
import { ScrollView } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { CalendarCheck } from 'lucide-react-native';
import { SafeAreaView } from '@/components/atoms';
import {
  AiDevotionalSheet,
  WelcomeHeader,
  VerseOfTheDayCard,
  ContinueReadingCard,
  StatsRow,
  ActivePlansSection,
  ProLockCard,
} from '@/components/organisms';
import { useHomeScreen } from '@/hooks/use-home-screen';

export default function HomeScreen() {
  const {
    translate,
    isPro,
    greetingKey,
    verseOfTheDay,
    verseText,
    verseLoading,
    bookName,
    chapter,
    translationLabel,
    stats,
    activePlans,
    handleContinueReading,
    handleVerseOfTheDay,
    handleExplorePlans,
    handleOpenPlan,
    handleOpenPaywall,
    devotionalVisible,
    devotionalContent,
    devotionalLoading,
    devotionalError,
    handleOpenDevotional,
    closeDevotionalSheet,
    retryDevotional,
  } = useHomeScreen();

  const statItems = useMemo(
    () => [
      { value: `${stats.progressPercent}%`, label: translate('home.progress') },
      { value: stats.streak, label: translate('home.streak') },
      // Highlights are a Pro feature; non-Pro users see a muted placeholder.
      isPro
        ? { value: stats.highlightCount, label: translate('home.highlights') }
        : { value: '—', label: translate('home.highlights'), muted: true },
    ],
    [stats, isPro, translate]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <WelcomeHeader greeting={translate(greetingKey)} subtitle={translate('home.subtitle')} />

        <VerseOfTheDayCard
          title={translate('home.verseOfTheDay')}
          verseText={verseLoading && !verseText ? translate('common.loading') : verseText}
          reference={verseOfTheDay.ref}
          actionLabel={translate('home.readInContext')}
          onPress={handleVerseOfTheDay}
          onDevotional={isPro ? handleOpenDevotional : undefined}
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

        {/* Reading plans are Pro, so the active-plans slot shows real plans for Pro
            users and a Pro lock card (→ paywall) for everyone else. */}
        {isPro ? (
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
          <ProLockCard
            icon={CalendarCheck}
            title={translate('plans.proLock.title')}
            description={translate('plans.proLock.description')}
            ctaLabel={translate('plans.proLock.action')}
            onPress={handleOpenPaywall}
          />
        )}

        {/* No separate bottom Pro card: under the new model a non-Pro user already
            sees the contextual Pro lock card in the plans slot above (the single
            Home nudge), and every Pro feature routes to the paywall when reached.
            Stacking a second holistic Pro card would violate the one-nudge rule. */}
      </ScrollView>

      <AiDevotionalSheet
        visible={devotionalVisible}
        reference={verseOfTheDay.ref}
        content={devotionalContent}
        isLoading={devotionalLoading}
        error={devotionalError}
        onClose={closeDevotionalSheet}
        onRetry={retryDevotional}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.semantic.bgSecondary,
  },
  scroll: {
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[4],
    paddingBottom: theme.spacing[10],
    gap: theme.spacing[4],
  },
}));
