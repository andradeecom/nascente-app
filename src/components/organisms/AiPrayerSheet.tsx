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

type AiPrayerSheetProps = {
  visible: boolean;
  reference: string;
  content: string | null;
  isLoading: boolean;
  error: AiGenerateError | null;
  onClose: () => void;
  onRetry: () => void;
};

export function AiPrayerSheet({ visible, reference, content, isLoading, error, onClose, onRetry }: AiPrayerSheetProps) {
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

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      enablePanDownToClose
      snapPoints={['60%', '90%']}
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
          {translate('ai.prayer.subtitle')}
        </Text>
      </View>

      <BottomSheetScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.centered}>
            <UniActivityIndicator size="large" />
            <Text variant={TEXT_VARIANTS.Body} color={TEXT_COLORS.TextSecondary} style={styles.centeredText}>
              {translate('ai.prayer.loading')}
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text variant={TEXT_VARIANTS.Body} color={TEXT_COLORS.Danger} style={styles.centeredText}>
              {translate('ai.prayer.error')}
            </Text>
            <Pressable onPress={onRetry} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
              <Text variant={TEXT_VARIANTS.Label} color={TEXT_COLORS.Accent}>
                {translate('common.retry')}
              </Text>
            </Pressable>
          </View>
        ) : content ? (
          <Text variant={TEXT_VARIANTS.Body} style={styles.contentText}>
            {content}
          </Text>
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
    paddingBottom: Platform.OS === 'ios' ? theme.spacing[24] : theme.spacing[4],
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
  contentText: {
    lineHeight: 26,
  },
  pressed: {
    opacity: 0.6,
  },
}));
