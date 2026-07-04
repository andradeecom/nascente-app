import { Modal, Pressable } from 'react-native';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { X } from 'lucide-react-native';
import { useTranslate } from '@/i18n';

const ThemedX = withUnistyles(X, (theme) => ({ color: theme.colors.semantic.textSecondary }));

type AppModalProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Show the top-right close (X) button. Defaults to true. */
  showClose?: boolean;
  /** Allow dismissing by tapping the dimmed backdrop. Defaults to true. */
  dismissOnBackdrop?: boolean;
};

/**
 * Generic dismissable dialog: a centered card floating over a dimmed backdrop.
 * Reusable shell for any modal content (upsell, confirmation, info) — compose
 * your own body as `children`. For the bottom-sheet style instead, see
 * `VerseActionSheet` / gorhom. Dismiss via backdrop tap or the close button.
 */
export function AppModal({ visible, onClose, children, showClose = true, dismissOnBackdrop = true }: AppModalProps) {
  const translate = useTranslate();

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable
        style={styles.backdrop}
        onPress={dismissOnBackdrop ? onClose : undefined}
        accessibilityRole="button"
        accessibilityLabel={translate('common.close')}
      >
        {/* Stop propagation so taps inside the card don't dismiss it. */}
        <Pressable style={styles.card} onPress={() => {}}>
          {showClose ? (
            <Pressable onPress={onClose} hitSlop={8} style={styles.close} accessibilityRole="button">
              <ThemedX size={20} />
            </Pressable>
          ) : null}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[6],
    backgroundColor: `rgba(0,0,0,${theme.opacity[40]})`,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: theme.colors.semantic.bgPrimary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing[6],
    ...theme.shadows.lg,
  },
  close: {
    position: 'absolute',
    top: theme.spacing[3],
    right: theme.spacing[3],
    zIndex: theme.zIndex.base + 1,
  },
}));
