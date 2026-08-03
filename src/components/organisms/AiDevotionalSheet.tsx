import { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, Platform, Pressable, View } from 'react-native';
import { StyleSheet, UnistylesRuntime, withUnistyles } from 'react-native-unistyles';
import { useFocusEffect } from 'expo-router';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { useTranslate } from '@/i18n';
import { useThemeStore } from '@/stores/theme';
import type { AiGenerateError } from '@/types/ai';

const UniActivityIndicator = withUnistyles(ActivityIndicator, (theme) => ({ color: theme.colors.semantic.accent }));

const DEVOTIONAL_SEPARATOR = '---';

function parseDevotionalContent(raw: string): { reflection: string; journalPrompt: string | null } {
  const parts = raw.split(DEVOTIONAL_SEPARATOR);
  if (parts.length >= 2) {
    return {
      reflection: parts[0].trim(),
      journalPrompt: parts.slice(1).join(DEVOTIONAL_SEPARATOR).trim() || null,
    };
  }
  return { reflection: raw.trim(), journalPrompt: null };
}

type AiDevotionalSheetProps = {
  visible: boolean;
  reference: string;
  content: string | null;
  isLoading: boolean;
  error: AiGenerateError | null;
  onClose: () => void;
  onRetry: () => void;
};

export function AiDevotionalSheet({
  visible,
  reference,
  content,
  isLoading,
  error,
  onClose,
  onRetry,
}: AiDevotionalSheetProps) {
  const translate = useTranslate();
  const sheetRef = useRef<BottomSheet>(null);

  // Not wrapped with withUnistyles: gorhom's internals read Reanimated shared
  // values during their own render, and forcing a re-render on every theme tick
  // trips Reanimated's strict-mode warning even while closed/off-screen. Read
  // theme name reactively (a plain string) and derive plain style objects instead.
  const themeName = useThemeStore((s) => s.theme);
  const { colors, radius } = UnistylesRuntime.getTheme(themeName);
  const sheetBackgroundStyle = {
    backgroundColor: colors.semantic.bgPrimary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  };
  const handleIndicatorStyle = { backgroundColor: colors.semantic.bgTertiary, width: 36 };

  useEffect(() => {
    if (visible) {
      sheetRef.current?.expand();
    } else {
      sheetRef.current?.close();
    }
  }, [visible]);

  // Force-close on screen blur (tab switch / navigation away) — the sheet is
  // screen-local UI and shouldn't stay mounted-open over an unrelated screen.
  useFocusEffect(
    useCallback(() => {
      return () => {
        sheetRef.current?.close();
      };
    }, [])
  );

  const handleChange = useCallback(
    (index: number) => {
      if (index === -1 && visible) onClose();
    },
    [visible, onClose]
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    []
  );

  const parsed = content ? parseDevotionalContent(content) : null;

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      enablePanDownToClose
      enableDynamicSizing={false}
      snapPoints={['55%', '93%']}
      onChange={handleChange}
      backdropComponent={renderBackdrop}
      backgroundStyle={sheetBackgroundStyle}
      handleIndicatorStyle={handleIndicatorStyle}
    >
      <View style={styles.header}>
        <Text variant={TEXT_VARIANTS.Title3} style={styles.reference}>
          {reference}
        </Text>
        <Text variant={TEXT_VARIANTS.Overline} color={TEXT_COLORS.TextTertiary} style={styles.subtitle}>
          {translate('ai.devotional.subtitle')}
        </Text>
      </View>

      <BottomSheetScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.centered}>
            <UniActivityIndicator size="large" />
            <Text variant={TEXT_VARIANTS.Body} color={TEXT_COLORS.TextSecondary} style={styles.centeredText}>
              {translate('ai.devotional.loading')}
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text variant={TEXT_VARIANTS.Body} color={TEXT_COLORS.Danger} style={styles.centeredText}>
              {translate('ai.devotional.error')}
            </Text>
            <Pressable onPress={onRetry} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
              <Text variant={TEXT_VARIANTS.Label} color={TEXT_COLORS.Accent}>
                {translate('common.retry')}
              </Text>
            </Pressable>
          </View>
        ) : parsed ? (
          <View style={styles.sections}>
            <View style={styles.section}>
              <Text variant={TEXT_VARIANTS.Overline} color={TEXT_COLORS.TextTertiary} style={styles.sectionLabel}>
                {translate('ai.devotional.reflectionLabel')}
              </Text>
              <Text variant={TEXT_VARIANTS.Body} style={styles.contentText}>
                {parsed.reflection}
              </Text>
            </View>

            {parsed.journalPrompt ? (
              <View style={[styles.section, styles.journalSection]}>
                <Text variant={TEXT_VARIANTS.Overline} color={TEXT_COLORS.TextTertiary} style={styles.sectionLabel}>
                  {translate('ai.devotional.journalLabel')}
                </Text>
                <Text variant={TEXT_VARIANTS.Body} style={styles.contentText}>
                  {parsed.journalPrompt}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create((theme) => ({
  header: {
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[1],
    paddingBottom: theme.spacing[3],
    gap: theme.spacing[1],
  },
  reference: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  scrollContent: {
    paddingHorizontal: theme.spacing[5],
    paddingBottom: Platform.OS === 'ios' ? theme.spacing[28] : theme.spacing[4],
    flexGrow: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[8],
    gap: theme.spacing[3],
  },
  centeredText: {
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.semantic.bgSecondary,
  },
  sections: {
    gap: theme.spacing[5],
  },
  section: {
    gap: theme.spacing[2],
  },
  journalSection: {
    backgroundColor: theme.colors.semantic.bgSecondary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing[4],
  },
  sectionLabel: {
    textTransform: 'uppercase',
  },
  contentText: {
    lineHeight: 26,
  },
  pressed: {
    opacity: 0.6,
  },
}));
