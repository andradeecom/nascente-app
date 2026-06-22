import { ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { SafeAreaView, Text } from '@/components/atoms';
import { SectionHeader } from '@/components/molecules';
import { ActivePlanCard, SuggestedPlanCard } from '@/components/organisms';
import usePlansScreen from './use-plans-screen';

export default function PlansScreen() {
  const { translate, activePlans, suggestedPlans, formatMeta, handleStart, startingPlanId } = usePlansScreen();

  const active = activePlans.data ?? [];
  const suggested = suggestedPlans.data ?? [];

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text variant="title1" style={styles.heading}>
          {translate('plans.title')}
        </Text>

        {/* Active plans */}
        <View style={styles.section}>
          <SectionHeader title={translate('plans.activeSection')} />
          {active.length > 0 ? (
            <View style={styles.list}>
              {active.map((plan) => (
                <ActivePlanCard key={plan.userPlan.id} plan={plan} nextLabel={translate('plans.next')} />
              ))}
            </View>
          ) : (
            <Text variant="callout" color="textSecondary">
              {activePlans.isError ? translate('plans.loadError') : translate('plans.emptyActive')}
            </Text>
          )}
        </View>

        {/* Suggested plans */}
        <View style={styles.section}>
          <SectionHeader title={translate('plans.suggestedSection')} />
          {suggested.length > 0 ? (
            <View style={styles.list}>
              {suggested.map((plan) => (
                <SuggestedPlanCard
                  key={plan.id}
                  plan={plan}
                  meta={formatMeta(plan)}
                  startLabel={translate('plans.start')}
                  onStart={() => handleStart(plan)}
                  loading={startingPlanId === plan.id}
                />
              ))}
            </View>
          ) : (
            <Text variant="callout" color="textSecondary">
              {suggestedPlans.isError ? translate('plans.loadError') : translate('plans.emptySuggested')}
            </Text>
          )}
        </View>
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
    gap: theme.spacing[6],
  },
  heading: {
    marginBottom: theme.spacing[2],
  },
  section: {
    gap: 0,
  },
  list: {
    gap: theme.spacing[3],
  },
}));
