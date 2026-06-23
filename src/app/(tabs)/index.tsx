import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, SafeAreaView, TextVariants } from '@/components/atoms';
import {
  WelcomeHeader,
  VerseOfTheDayCard,
  ContinueReadingCard,
  StatsRow,
  ActivePlansSection,
} from '@/components/organisms';
import { useHomeScreen } from '@/hooks/use-home-screen';

export default function HomeScreen() {
  const {
    translate,
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

        <StatsRow stats={statItems} />

        <ActivePlansSection
          title={translate('home.activePlans')}
          exploreLabel={translate('home.explore')}
          emptyLabel={translate('home.noActivePlans')}
          nextLabel={translate('plans.next')}
          plans={activePlans.data ?? []}
          onExplore={handleExplorePlans}
          onPlanPress={handleContinueReading}
        />

        {/* ── Pro CTA ─────────────────────────────────────────────────────── */}
        {/* TODO: Only render for non-premium users once subscription state is available */}
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
