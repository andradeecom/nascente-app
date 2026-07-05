import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button, Input, SafeAreaView, Slider, Text, TEXT_VARIANTS, TEXT_COLORS } from '@/components/atoms';
import { BUTTON_SIZES, BUTTON_VARIANTS } from '@/components/atoms/Button';
import { AppModal } from '@/components/molecules';
import { ScreenHeader } from '@/components/organisms';
import useCreatePlanScreen from './use-create-plan-screen';

/** Tappable example topics that pre-fill the input (keys → localized strings). */
const EXAMPLE_KEYS = ['anxiety', 'gratitude', 'forgiveness', 'hope', 'grief'] as const;

export default function CreatePlanScreen() {
  const {
    translate,
    step,
    topic,
    setTopic,
    days,
    setDays,
    minDays,
    maxDays,
    canGenerate,
    generating,
    saving,
    preview,
    previewDays,
    handleSelectExample,
    handleGenerate,
    handleBackToInput,
    handleSave,
    notice,
    closeNotice,
  } = useCreatePlanScreen();

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScreenHeader title={translate('aiPlan.title')} onBack={step === 'preview' ? handleBackToInput : undefined} />

      {step === 'input' ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text variant={TEXT_VARIANTS.Body} color={TEXT_COLORS.TextSecondary}>
            {translate('aiPlan.inputSubtitle')}
          </Text>

          <Input
            value={topic}
            onChangeText={setTopic}
            placeholder={translate('aiPlan.inputPlaceholder')}
            multiline
            style={styles.input}
            editable={!generating}
          />

          <View style={styles.examples}>
            <Text variant={TEXT_VARIANTS.Overline} color={TEXT_COLORS.TextTertiary} style={styles.exampleLabel}>
              {translate('aiPlan.examplesLabel')}
            </Text>
            <View style={styles.exampleChips}>
              {EXAMPLE_KEYS.map((key) => {
                const label = translate(`aiPlan.examples.${key}`);
                return (
                  <Pressable
                    key={key}
                    onPress={() => handleSelectExample(label)}
                    style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                    disabled={generating}
                  >
                    <Text variant={TEXT_VARIANTS.Label} color={TEXT_COLORS.Accent}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.daysSection}>
            <View style={styles.daysHeader}>
              <Text variant={TEXT_VARIANTS.Label}>{translate('aiPlan.durationLabel')}</Text>
              <Text variant={TEXT_VARIANTS.Label} color={TEXT_COLORS.Accent}>
                {translate('aiPlan.daysValue', { count: days })}
              </Text>
            </View>
            <Slider
              steps={maxDays - minDays + 1}
              value={days - minDays}
              onChange={(index) => setDays(minDays + index)}
            />
          </View>

          <Button
            size={BUTTON_SIZES.Large}
            fullWidth
            label={generating ? translate('aiPlan.generating') : translate('aiPlan.generateButton')}
            onPress={handleGenerate}
            disabled={!canGenerate}
          />
          {generating ? (
            <View style={styles.generatingRow}>
              <ActivityIndicator color={styles.accent.color} />
              <Text variant={TEXT_VARIANTS.Caption} color={TEXT_COLORS.TextSecondary}>
                {translate('aiPlan.generatingHint')}
              </Text>
            </View>
          ) : null}

          <View style={styles.quotaNote}>
            <Text variant={TEXT_VARIANTS.Label} color={TEXT_COLORS.TextTertiary}>
              {translate('aiPlan.quotaNote')}
            </Text>
            <Text variant={TEXT_VARIANTS.Label} color={TEXT_COLORS.TextTertiary}>
              {translate('aiPlan.retentionNote')}
            </Text>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {preview ? (
            <>
              <Text variant={TEXT_VARIANTS.Title2}>{preview.title}</Text>
              {preview.description ? (
                <Text variant={TEXT_VARIANTS.Body} color={TEXT_COLORS.TextSecondary}>
                  {preview.description}
                </Text>
              ) : null}

              <Text variant={TEXT_VARIANTS.Overline} color={TEXT_COLORS.TextTertiary} style={styles.exampleLabel}>
                {translate('aiPlan.daysValue', { count: preview.totalDays })}
              </Text>

              <View style={styles.dayList}>
                {previewDays.map((d) => (
                  <View key={d.day} style={styles.dayRow}>
                    <Text variant={TEXT_VARIANTS.Label} color={TEXT_COLORS.Accent} style={styles.dayNumber}>
                      {translate('aiPlan.dayLabel', { day: d.day })}
                    </Text>
                    <Text variant={TEXT_VARIANTS.Body}>{d.label}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.buttons}>
                <Button
                  size={BUTTON_SIZES.Large}
                  fullWidth
                  label={translate('aiPlan.saveButton')}
                  onPress={handleSave}
                  disabled={saving}
                />
                <Button
                  size={BUTTON_SIZES.Large}
                  variant={BUTTON_VARIANTS.Ghost}
                  fullWidth
                  label={translate('aiPlan.retryButton')}
                  onPress={handleBackToInput}
                  disabled={saving}
                />
              </View>
            </>
          ) : null}
        </ScrollView>
      )}

      <AppModal visible={notice != null} onClose={closeNotice}>
        <View style={styles.notice}>
          <Text variant={TEXT_VARIANTS.Title3} style={styles.noticeText}>
            {notice?.title}
          </Text>
          <Text variant={TEXT_VARIANTS.Callout} color={TEXT_COLORS.TextSecondary} style={styles.noticeText}>
            {notice?.message}
          </Text>
          <Button
            size={BUTTON_SIZES.Large}
            fullWidth
            label={translate('common.ok')}
            onPress={closeNotice}
            style={styles.noticeButton}
          />
        </View>
      </AppModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.semantic.bgPrimary,
  },
  content: {
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[5],
    gap: theme.spacing[8],
  },
  input: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingVertical: theme.spacing[5],
  },
  examples: {
    gap: theme.spacing[4],
  },
  exampleLabel: {
    textTransform: 'uppercase',
  },
  exampleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[4],
  },
  chip: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.semantic.accentSubtle,
  },
  chipPressed: {
    opacity: 0.6,
  },
  daysSection: {
    gap: theme.spacing[6],
  },
  daysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quotaNote: {
    marginTop: 'auto',
    gap: theme.spacing[2],
  },
  generatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[2],
  },
  accent: {
    color: theme.colors.semantic.accent,
  },
  dayList: {
    gap: theme.spacing[2],
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  dayNumber: {
    minWidth: 56,
  },
  buttons: {
    gap: theme.spacing[2],
  },
  notice: {
    gap: theme.spacing[3],
  },
  noticeText: {
    textAlign: 'center',
  },
  noticeButton: {
    marginTop: theme.spacing[2],
  },
}));
