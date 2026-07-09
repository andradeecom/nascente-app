import { Modal, Pressable } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { X } from 'lucide-react-native';
import { useTranslate } from '@/i18n';

const ThemedX = withUnistyles(X, (theme) => ({ color: theme.colors.semantic.textSecondary }));

// Plain object (not a Unistyles style) — `KeyboardAvoidingView` is Reanimated-based
// and fails when it receives a style carrying the `unistyles_` marker.
const flexFill = { flex: 1 } as const;

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
      {/* RN Modal renders in a separate native hierarchy the app-root
          GestureHandlerRootView doesn't reach, so gesture-handler-based
          pressables inside (our `Button` → pressto's PressableScale) get no
          touches without a GHRV of the modal's own. */}
      <GestureHandlerRootView style={flexFill}>
        {/* Lift the centered card above the keyboard (e.g. NoteEditorModal's
            autoFocus'd field). rn-keyboard-controller's KeyboardAvoidingView
            works inside RN Modal, unlike RN's own. */}
        <KeyboardAvoidingView behavior="padding" style={flexFill}>
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
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
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
