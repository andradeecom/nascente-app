import { useMemo } from 'react';
import { View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { CalendarCheck, Sparkles } from 'lucide-react-native';
import { Button, SafeAreaView, TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { BUTTON_SIZES, BUTTON_VARIANTS } from '@/components/atoms/Button';
import { SectionHeader } from '@/components/molecules';
import { ActivePlanCard, ProLockCard, SuggestedPlanCard, UpsellModal } from '@/components/organisms';
import type { ActiveReadingPlan, SuggestedReadingPlan } from '@/types/reading-plans';
import usePlansScreen from './use-plans-screen';

const UniSparkles = withUnistyles(Sparkles, (theme) => ({ color: theme.colors.semantic.accent }));

type ListItem =
  | { type: 'header'; key: string; title: string }
  | { type: 'empty'; key: string; message: string }
  | { type: 'active'; key: string; plan: ActiveReadingPlan }
  | { type: 'suggested'; key: string; plan: SuggestedReadingPlan };

export default function PlansScreen() {
  const {
    translate,
    isPro,
    activePlans,
    suggestedPlans,
    formatMeta,
    handleStart,
    handleUpgrade,
    proRequiresAccount,
    handleOpenPlan,
    handleCreateWithAi,
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

  if (!isPro) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <View style={styles.content}>
          <Text variant={TEXT_VARIANTS.Title1}>{translate('plans.title')}</Text>
          <ProLockCard
            icon={CalendarCheck}
            title={translate('plans.proLock.title')}
            description={translate('plans.proLock.description')}
            ctaLabel={translate('plans.proLock.action')}
            hint={proRequiresAccount ? translate('paywall.requiresAccount') : undefined}
            onPress={handleUpgrade}
          />
        </View>
      </SafeAreaView>
    );
  }

  const listHeader = (
    <View style={styles.listHeader}>
      <Text variant={TEXT_VARIANTS.Title1}>{translate('plans.title')}</Text>
      <Button
        variant={BUTTON_VARIANTS.Pro}
        size={BUTTON_SIZES.Medium}
        label={translate('aiPlan.createButton')}
        icon={<UniSparkles size={18} strokeWidth={2} />}
        onPress={handleCreateWithAi}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlashList
        data={items}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => {
          switch (item.type) {
            case 'header':
              return <SectionHeader title={item.title} />;
            case 'empty':
              return (
                <Text variant={TEXT_VARIANTS.Callout} color={TEXT_COLORS.TextSecondary}>
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
    paddingHorizontal: theme.spacing[3],
  },
  content: {
    paddingTop: theme.spacing[3],
    gap: theme.spacing[6],
  },
  listHeader: {
    gap: theme.spacing[3],
    marginBottom: theme.spacing[4],
  },
  listContent: {
    paddingTop: theme.spacing[3],
    paddingBottom: theme.spacing[24],
    paddingHorizontal: theme.spacing[2],
  },
  separator: {
    height: theme.spacing[3],
  },
}));
