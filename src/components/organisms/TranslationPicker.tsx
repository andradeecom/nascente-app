import { Modal, Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Check, X } from 'lucide-react-native';
import { Text, SafeAreaView } from '@/components/atoms';
import { useTranslate } from '@/i18n';
import { TRANSLATIONS, type TranslationId } from '@/types/bible';

const TRANSLATION_LIST = Object.values(TRANSLATIONS);

type Props = {
  visible: boolean;
  currentId: TranslationId;
  onSelect: (id: TranslationId) => void;
  onClose: () => void;
};

export function TranslationPicker({ visible, currentId, onSelect, onClose }: Props) {
  const translate = useTranslate();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text variant="title3" style={styles.headerTitle}>
            {translate('reader.translation')}
          </Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={22} color={styles.closeIcon.color} />
          </Pressable>
        </View>

        {TRANSLATION_LIST.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => onSelect(t.id)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <View style={styles.rowContent}>
              <Text variant="body">{t.label}</Text>
              <Text variant="caption" color="textSecondary">
                {t.lang.toUpperCase()}
              </Text>
            </View>
            {t.id === currentId && <Check size={20} color={styles.checkIcon.color} />}
          </Pressable>
        ))}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.semantic.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.semantic.bgTertiary,
  },
  headerSpacer: {
    width: 22,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  closeIcon: {
    color: theme.colors.semantic.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.semantic.bgTertiary,
  },
  pressed: {
    opacity: 0.6,
  },
  rowContent: {
    flex: 1,
    gap: theme.spacing[0.5],
  },
  checkIcon: {
    color: theme.colors.semantic.accent,
  },
}));
