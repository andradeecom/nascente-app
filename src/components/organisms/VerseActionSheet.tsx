import { Modal, Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Check, Trash2 } from 'lucide-react-native';
import { Text, TextVariants } from '@/components/atoms';
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
};

export function VerseActionSheet({ visible, reference, currentColor, onPick, onRemove, onClose }: Props) {
  const translate = useTranslate();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Stop propagation so taps inside the sheet don't close it. */}
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          <Text variant={TextVariants.Overline} color="textTertiary" style={styles.label}>
            {translate('study.highlightVerse')}
          </Text>
          <Text variant={TextVariants.Title3} style={styles.reference}>
            {reference}
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
              <Text variant={TextVariants.Label} color="danger">
                {translate('study.removeHighlight')}
              </Text>
            </Pressable>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: theme.colors.semantic.bgPrimary,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[3],
    paddingBottom: theme.spacing[8],
    gap: theme.spacing[2],
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.semantic.bgTertiary,
    marginBottom: theme.spacing[3],
  },
  label: {
    textAlign: 'center',
  },
  reference: {
    textAlign: 'center',
    marginBottom: theme.spacing[4],
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
    marginTop: theme.spacing[5],
    paddingVertical: theme.spacing[2],
  },
  removeIcon: {
    color: theme.colors.semantic.danger,
  },
  pressed: {
    opacity: 0.6,
  },
}));
