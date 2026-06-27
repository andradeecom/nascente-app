import { useCallback, useEffect, useRef } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { Bookmark, BookmarkCheck, Check, NotebookPen, Trash2 } from 'lucide-react-native';
import { Text, TEXT_VARIANTS } from '@/components/atoms';
import { useTranslate } from '@/i18n';
import { highlights as HIGHLIGHT_HEX } from '@/theme/colors';
import { HIGHLIGHT_COLORS, type HighlightColor } from '@/types/study';

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
}: Props) {
  const translate = useTranslate();
  const sheetRef = useRef<BottomSheet>(null);

  // Drive the imperative sheet from the declarative `visible` prop so the
  // Reader keeps its existing show/hide contract.
  useEffect(() => {
    if (visible) {
      sheetRef.current?.expand();
    } else {
      sheetRef.current?.close();
    }
  }, [visible]);

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

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      enablePanDownToClose
      enableDynamicSizing
      onChange={handleChange}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.content}>
        <Text variant={TEXT_VARIANTS.Title3} style={styles.reference}>
          {reference}
        </Text>

        <Text variant={TEXT_VARIANTS.Overline} color="textTertiary" style={styles.label}>
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
              {currentColor === color ? <Check size={18} color={styles.swatchCheck.color} strokeWidth={3} /> : null}
            </Pressable>
          ))}
        </View>

        {currentColor ? (
          <Pressable onPress={onRemove} style={({ pressed }) => [styles.remove, pressed && styles.pressed]}>
            <Trash2 size={18} color={styles.removeIcon.color} strokeWidth={2} />
            <Text variant={TEXT_VARIANTS.Label} color="danger">
              {translate('study.removeHighlight')}
            </Text>
          </Pressable>
        ) : null}

        <View style={styles.divider} />

        <View style={styles.actions}>
          <Pressable
            onPress={onToggleBookmark}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            {isBookmarked ? (
              <BookmarkCheck size={20} color={styles.actionAccent.color} strokeWidth={2} />
            ) : (
              <Bookmark size={20} color={styles.actionIcon.color} strokeWidth={2} />
            )}
            <Text variant={TEXT_VARIANTS.Label} color={isBookmarked ? 'accent' : 'textPrimary'}>
              {translate(isBookmarked ? 'study.removeBookmark' : 'study.addBookmark')}
            </Text>
          </Pressable>

          <Pressable
            onPress={onOpenNote}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <NotebookPen
              size={20}
              color={hasNote ? styles.actionAccent.color : styles.actionIcon.color}
              strokeWidth={2}
            />
            <Text variant={TEXT_VARIANTS.Label} color={hasNote ? 'accent' : 'textPrimary'}>
              {translate(hasNote ? 'study.editNote' : 'study.addNote')}
            </Text>
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create((theme) => ({
  sheetBackground: {
    backgroundColor: theme.colors.semantic.bgPrimary,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
  },
  handleIndicator: {
    backgroundColor: theme.colors.semantic.bgTertiary,
    width: 36,
  },
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
  swatchCheck: {
    color: '#1A1A1A',
  },
  remove: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[2],
    marginTop: theme.spacing[2],
    paddingVertical: theme.spacing[2],
  },
  removeIcon: {
    color: theme.colors.semantic.danger,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.semantic.bgTertiary,
    marginVertical: theme.spacing[2],
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing[3],
  },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[2],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.semantic.bgSecondary,
  },
  actionIcon: {
    color: theme.colors.semantic.textPrimary,
  },
  actionAccent: {
    color: theme.colors.semantic.accent,
  },
  pressed: {
    opacity: 0.6,
  },
}));
