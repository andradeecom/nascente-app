import { ActivityIndicator, View, type ViewStyle } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { StyleSheet } from 'react-native-unistyles';
import { Button, SafeAreaView, Text, TextVariants } from '@/components/atoms';
import { PlanDayRow, ScreenHeader, UpsellModal } from '@/components/organisms';
import type { PlanDayGroup } from '@/types/reading-plans';
import usePlanDetailScreen from './use-plan-detail-screen';

export default function PlanDetailScreen() {
  const {
    translate,
    plan,
    days,
    isEnrolled,
    progressPercent,
    isLoading,
    isError,
    isStarting,
    markingDay,
    formatMeta,
    handleStart,
    handleOpenReading,
    handleToggleComplete,
    handleRemove,
    handleBack,
    activeLimit,
    limitModalVisible,
    closeLimitModal,
    handleUpsellCta,
  } = usePlanDetailScreen();

  const listHeader = plan ? (
    <View style={styles.header}>
      <View style={styles.head}>
        <Text variant={TextVariants.Title2}>{plan.title}</Text>
        <Text variant={TextVariants.Caption} color="textTertiary">
          {formatMeta(plan)}
        </Text>
        {plan.description ? (
          <Text variant={TextVariants.Callout} color="textSecondary" style={styles.description}>
            {plan.description}
          </Text>
        ) : null}
      </View>

      {isEnrolled ? (
        <View style={styles.progress}>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${progressPercent}%` } as ViewStyle]} />
          </View>
          <Text variant={TextVariants.Caption} color="textSecondary">
            {progressPercent}%
          </Text>
        </View>
      ) : null}
    </View>
  ) : null;

  const listItem = (item: PlanDayGroup) => (
    <PlanDayRow
      item={item}
      isEnrolled={isEnrolled}
      markingDay={markingDay}
      onToggleComplete={handleToggleComplete}
      onOpenReading={handleOpenReading}
    />
  );

  const listFooter = plan ? (
    <View style={styles.footer}>
      {isEnrolled ? (
        <Button
          variant="ghost"
          size="lg"
          fullWidth
          label={translate('plans.remove.action')}
          onPress={handleRemove}
          style={styles.remove}
        />
      ) : (
        <Button size="lg" fullWidth label={translate('plans.start')} onPress={handleStart} disabled={isStarting} />
      )}
    </View>
  ) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScreenHeader title={plan?.title ?? translate('plans.detailTitle')} onBack={handleBack} />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={styles.accent.color} />
        </View>
      ) : isError || !plan ? (
        <View style={styles.center}>
          <Text variant={TextVariants.Callout} color="textSecondary">
            {translate('plans.loadError')}
          </Text>
        </View>
      ) : (
        <FlashList<PlanDayGroup>
          data={days}
          keyExtractor={(item) => String(item.day)}
          renderItem={({ item }) => listItem(item)}
          ItemSeparatorComponent={() => <View style={styles.daySeparator} />}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

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
    backgroundColor: theme.colors.semantic.bgPrimary,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accent: {
    color: theme.colors.semantic.accent,
  },
  listContent: {
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[2],
    paddingBottom: theme.spacing[8],
  },
  header: {
    gap: theme.spacing[5],
    marginBottom: theme.spacing[5],
  },
  head: {
    gap: theme.spacing[2],
  },
  description: {
    marginTop: theme.spacing[1],
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.semantic.bgTertiary,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.semantic.accent,
  },
  daySeparator: {
    height: theme.spacing[2],
  },
  footer: {
    marginTop: theme.spacing[5],
  },
  remove: {
    marginTop: theme.spacing[2],
  },
}));
