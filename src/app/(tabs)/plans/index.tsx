import { useMemo } from 'react';
import { View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { StyleSheet } from 'react-native-unistyles';
import { CalendarCheck } from 'lucide-react-native';
import { SafeAreaView, Text, TextVariants } from '@/components/atoms';
import { SectionHeader } from '@/components/molecules';
import { ActivePlanCard, SignInPromptCard, SuggestedPlanCard, UpsellModal } from '@/components/organisms';
import type { ActiveReadingPlan, SuggestedReadingPlan } from '@/types/reading-plans';
import usePlansScreen from './use-plans-screen';

type ListItem =
  | { type: 'header'; key: string; title: string }
  | { type: 'empty'; key: string; message: string }
  | { type: 'active'; key: string; plan: ActiveReadingPlan }
  | { type: 'suggested'; key: string; plan: SuggestedReadingPlan };

export default function PlansScreen() {
  const {
    translate,
    isAuthenticated,
    activePlans,
    suggestedPlans,
    formatMeta,
    handleStart,
    handleSignIn,
    handleOpenPlan,
    startingPlanId,
    activeLimit,
    limitModalVisible,
    closeLimitModal,
    handleUpsellCta,
  } = usePlansScreen();

  const items = useMemo<ListItem[]>(() => {
    const active = activePlans.data ?? [];
    const suggested = suggestedPlans.data ?? [];
    const list: ListItem[] = [];
    list.push({ type: 'header', key: 'active-header', title: translate('plans.activeSection') });
    if (active.length > 0) {
      active.forEach((plan) => list.push({ type: 'active', key: `active-${plan.userPlan.id}`, plan }));
    } else {
      list.push({
        type: 'empty',
        key: 'active-empty',
        message: activePlans.isError ? translate('plans.loadError') : translate('plans.emptyActive'),
      });
    }
    list.push({ type: 'header', key: 'suggested-header', title: translate('plans.suggestedSection') });
    if (suggested.length > 0) {
      suggested.forEach((plan) => list.push({ type: 'suggested', key: `suggested-${plan.id}`, plan }));
    } else {
      list.push({
        type: 'empty',
        key: 'suggested-empty',
        message: suggestedPlans.isError ? translate('plans.loadError') : translate('plans.emptySuggested'),
      });
    }
    return list;
  }, [activePlans.data, activePlans.isError, suggestedPlans.data, suggestedPlans.isError, translate]);

  if (!isAuthenticated) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.content}>
          <Text variant={TextVariants.Title1} style={styles.heading}>
            {translate('plans.title')}
          </Text>
          <SignInPromptCard
            icon={CalendarCheck}
            title={translate('plans.signIn.title')}
            description={translate('plans.signIn.description')}
            actionLabel={translate('plans.signIn.action')}
            onPress={handleSignIn}
          />
        </View>
      </SafeAreaView>
    );
  }

  const listHeader = (
    <Text variant={TextVariants.Title1} style={styles.heading}>
      {translate('plans.title')}
    </Text>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <FlashList
        data={items}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => {
          switch (item.type) {
            case 'header':
              return <SectionHeader title={item.title} />;
            case 'empty':
              return (
                <Text variant={TextVariants.Callout} color="textSecondary">
                  {item.message}
                </Text>
              );
            case 'active':
              return (
                <ActivePlanCard
                  plan={item.plan}
                  nextLabel={translate('plans.next')}
                  onPress={() => handleOpenPlan(item.plan.plan.id)}
                />
              );
            case 'suggested':
              return (
                <SuggestedPlanCard
                  plan={item.plan}
                  meta={formatMeta(item.plan)}
                  startLabel={translate('plans.start')}
                  onStart={() => handleStart(item.plan)}
                  onPress={() => handleOpenPlan(item.plan.id)}
                  loading={startingPlanId === item.plan.id}
                />
              );
          }
        }}
        getItemType={(item) => item.type}
        ListHeaderComponent={listHeader}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <UpsellModal
        visible={limitModalVisible}
        title={translate('plans.limitReached.title')}
        description={translate('plans.limitReached.message', { count: activeLimit })}
        ctaLabel={translate('plans.limitReached.cta')}
        onCta={handleUpsellCta}
        onClose={closeLimitModal}
      />
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
  listContent: {
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[3],
    paddingBottom: theme.spacing[8],
  },
  separator: {
    height: theme.spacing[3],
  },
}));
