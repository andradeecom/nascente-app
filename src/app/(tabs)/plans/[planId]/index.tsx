import { ActivityIndicator, Pressable, ScrollView, View, type ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Check, ChevronRight } from 'lucide-react-native';
import { Button, SafeAreaView, Text, TextVariants } from '@/components/atoms';
import { ScreenHeader } from '@/components/organisms';
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
  } = usePlanDetailScreen();

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
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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

          <View style={styles.days}>
            {days.map((day) => (
              <View key={day.day} style={styles.dayRow}>
                {isEnrolled ? (
                  <Pressable
                    onPress={() => handleToggleComplete(day)}
                    disabled={day.completed || markingDay === day.day}
                    hitSlop={8}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: day.completed }}
                    style={[styles.check, day.completed && styles.checkDone]}
                  >
                    {day.completed ? <Check size={16} color={styles.checkDoneIcon.color} strokeWidth={3} /> : null}
                  </Pressable>
                ) : (
                  <View style={styles.dayBadge}>
                    <Text variant={TextVariants.Caption} color="accent" style={styles.dayBadgeText}>
                      {day.day}
                    </Text>
                  </View>
                )}

                <Pressable style={styles.dayBody} onPress={() => handleOpenReading(day)}>
                  <Text variant={TextVariants.Caption} color="textTertiary">
                    {translate('plans.day', { count: day.day })}
                  </Text>
                  <Text variant={TextVariants.Body} numberOfLines={1}>
                    {day.label}
                  </Text>
                </Pressable>

                <ChevronRight size={18} color={styles.chevron.color} />
              </View>
            ))}
          </View>

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
        </ScrollView>
      )}
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
  content: {
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[2],
    paddingBottom: theme.spacing[8],
    gap: theme.spacing[5],
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
  days: {
    gap: theme.spacing[2],
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
    backgroundColor: theme.colors.semantic.bgSecondary,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.full,
    borderWidth: 2,
    borderColor: theme.colors.semantic.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: {
    backgroundColor: theme.colors.semantic.accent,
    borderColor: theme.colors.semantic.accent,
  },
  checkDoneIcon: {
    color: theme.colors.semantic.bgPrimary,
  },
  dayBadge: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.semantic.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadgeText: {
    fontWeight: theme.font.weights.semibold,
  },
  dayBody: {
    flex: 1,
    gap: theme.spacing[0.5],
  },
  chevron: {
    color: theme.colors.semantic.textTertiary,
  },
  remove: {
    marginTop: theme.spacing[2],
  },
}));
