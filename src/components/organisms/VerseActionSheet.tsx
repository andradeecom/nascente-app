import { useCallback, useEffect, useRef } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet, UnistylesRuntime, withUnistyles } from 'react-native-unistyles';
import { useFocusEffect } from 'expo-router';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { Bookmark, BookmarkCheck, Check, HandHeart, NotebookPen, Sparkles, Trash2 } from 'lucide-react-native';
import { Button, TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { BUTTON_SIZES, BUTTON_VARIANTS } from '@/components/atoms/Button';
import { useTranslate } from '@/i18n';
import { useThemeStore } from '@/stores/theme';
import { highlights as HIGHLIGHT_HEX } from '@/theme/colors';
import { HIGHLIGHT_COLORS, type HighlightColor } from '@/types/study';

const UniBookmark = withUnistyles(Bookmark, (theme) => ({ color: theme.colors.semantic.textPrimary }));
const UniBookmarkCheck = withUnistyles(BookmarkCheck, (theme) => ({ color: theme.colors.semantic.accent }));
const UniNotebookPen = withUnistyles(NotebookPen, (theme) => ({ color: theme.colors.semantic.textPrimary }));
const UniSparkles = withUnistyles(Sparkles, (theme) => ({ color: theme.colors.semantic.textPrimary }));
const UniHandHeart = withUnistyles(HandHeart, (theme) => ({ color: theme.colors.semantic.textPrimary }));
const UniTrash2 = withUnistyles(Trash2, (theme) => ({ color: theme.colors.semantic.danger }));

type Props = {
  visible: boolean;
  /** Reference label, e.g. "João 3:16". */
  reference: string;
  /** Current color for this verse, or null if not highlighted yet. */
  currentColor: HighlightColor | null;
  onPick: (color: HighlightColor) => void;
  onRemove: () => void;
  onClose: () => void;
  /** Whether this verse is bookmarked. */
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  /** Whether this verse already has a note (changes the action label). */
  hasNote: boolean;
  onOpenNote: () => void;
  onExplain: () => void;
  onPray: () => void;
};

export function VerseActionSheet({
  visible,
  reference,
  currentColor,
  onPick,
  onRemove,
  onClose,
  isBookmarked,
  onToggleBookmark,
  hasNote,
  onOpenNote,
  onExplain,
  onPray,
}: Props) {
  const translate = useTranslate();
  const sheetRef = useRef<BottomSheet>(null);

  // BottomSheet is not wrapped with withUnistyles: gorhom's internals read
  // Reanimated shared values (animatedIndex/animatedPosition) during their own
  // render, and forcing this component to re-render on every theme tick (which
  // withUnistyles would do) trips Reanimated's strict-mode "reading value during
  // render" warning even while the sheet is closed/off-screen. Instead we read
  // the theme name reactively (a plain Zustand string, not a shared-value proxy)
  // and derive plain style objects — cheap, and doesn't force BottomSheet's
  // internal re-render machinery.
  const themeName = useThemeStore((s) => s.theme);
  const { colors, radius } = UnistylesRuntime.getTheme(themeName);
  const sheetBackgroundStyle = {
    backgroundColor: colors.semantic.bgPrimary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  };
  const handleIndicatorStyle = { backgroundColor: colors.semantic.bgTertiary, width: 36 };

  // Drive the imperative sheet from the declarative `visible` prop so the
  // Reader keeps its existing show/hide contract.
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

  // Fire onClose when the sheet settles closed (covers swipe-down and backdrop tap).
  const handleChange = useCallback(
    (index: number) => {
      if (index === -1 && visible) {
        onClose();
      }
    },
    [visible, onClose]
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    []
  );

  const actions = [
    {
      key: 'bookmark',
      onPress: onToggleBookmark,
      label: translate(isBookmarked ? 'study.removeBookmark' : 'study.addBookmark'),
      icon: isBookmarked ? (
        <UniBookmarkCheck size={20} strokeWidth={1.5} />
      ) : (
        <UniBookmark size={20} strokeWidth={1.5} />
      ),
    },
    {
      key: 'note',
      onPress: onOpenNote,
      label: translate(hasNote ? 'study.editNote' : 'study.addNote'),
      icon: hasNote ? (
        <UniNotebookPen size={20} strokeWidth={1.5} uniProps={(theme) => ({ color: theme.colors.semantic.accent })} />
      ) : (
        <UniNotebookPen size={20} strokeWidth={1.5} />
      ),
    },
    {
      key: 'explain',
      onPress: onExplain,
      label: translate('ai.explain.action'),
      icon: <UniSparkles size={20} strokeWidth={1.5} />,
    },
    {
      key: 'prayer',
      onPress: onPray,
      label: translate('ai.prayer.action'),
      icon: <UniHandHeart size={20} strokeWidth={1.5} />,
    },
  ];

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      enablePanDownToClose
      enableDynamicSizing
      onChange={handleChange}
      backdropComponent={renderBackdrop}
      backgroundStyle={sheetBackgroundStyle}
      handleIndicatorStyle={handleIndicatorStyle}
    >
      <BottomSheetView style={styles.content}>
        <Text variant={TEXT_VARIANTS.Title3} style={styles.reference}>
          {reference}
        </Text>

        <Text variant={TEXT_VARIANTS.Overline} color={TEXT_COLORS.TextTertiary} style={styles.label}>
          {translate('study.highlightVerse')}
        </Text>
        <View style={styles.swatches}>
          {HIGHLIGHT_COLORS.map((color) => (
            <Pressable
              key={color}
              onPress={() => onPick(color)}
              style={[styles.swatch, { backgroundColor: HIGHLIGHT_HEX[color] }]}
              accessibilityRole="button"
              accessibilityLabel={color}
            >
              {currentColor === color ? <Check size={18} color="#1A1A1A" strokeWidth={3} /> : null}
            </Pressable>
          ))}
        </View>

        {currentColor ? (
          <Pressable onPress={onRemove} style={({ pressed }) => [styles.remove, pressed && styles.pressed]}>
            <UniTrash2 size={18} strokeWidth={2} />
            <Text variant={TEXT_VARIANTS.Label} color={TEXT_COLORS.Danger}>
              {translate('study.removeHighlight')}
            </Text>
          </Pressable>
        ) : null}

        <View style={styles.divider} />

        <View style={styles.actions}>
          {actions.map((action) => (
            <Button
              key={action.key}
              onPress={action.onPress}
              label={action.label}
              icon={action.icon}
              variant={BUTTON_VARIANTS.Pro}
              size={BUTTON_SIZES.Small}
              style={styles.action}
            />
          ))}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: {
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[1],
    paddingBottom: theme.spacing[8],
    gap: theme.spacing[2],
  },
  label: {
    textAlign: 'center',
  },
  reference: {
    textAlign: 'center',
    marginBottom: theme.spacing[2],
  },
  swatches: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing[2],
  },
  swatch: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remove: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[2],
    marginTop: theme.spacing[2],
    paddingVertical: theme.spacing[2],
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.semantic.bgTertiary,
    marginVertical: theme.spacing[2],
  },
  actions: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing[4],
  },
  action: {
    width: '46%',
    height: 48,
  },
  pressed: {
    opacity: 0.6,
  },
}));
