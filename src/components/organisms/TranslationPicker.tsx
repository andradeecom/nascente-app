import { Modal, Pressable, SectionList, View } from 'react-native';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { Check, Lock, X } from 'lucide-react-native';
import { Text, TEXT_VARIANTS, SafeAreaView } from '@/components/atoms';
import { useTranslate } from '@/i18n';
import { useIsPro } from '@/hooks/use-profile';
import { FREE_TRANSLATIONS, PRO_TRANSLATIONS, type TranslationId, type TranslationMeta } from '@/types/bible';

const ThemedX = withUnistyles(X, (theme) => ({ color: theme.colors.semantic.textSecondary }));
const ThemedCheck = withUnistyles(Check, (theme) => ({ color: theme.colors.semantic.accent }));
const ThemedLock = withUnistyles(Lock, (theme) => ({ color: theme.colors.semantic.textTertiary }));

type Section = { tier: 'free' | 'pro'; data: TranslationMeta[] };

type Props = {
  visible: boolean;
  currentId: TranslationId;
  onSelect: (id: TranslationId) => void;
  /** Called when a guest/free user taps a Pro-gated translation. Routes to the paywall. */
  onUpsell: () => void;
  onClose: () => void;
};

export function TranslationPicker({ visible, currentId, onSelect, onUpsell, onClose }: Props) {
  const translate = useTranslate();
  const isPro = useIsPro();

  const sections: Section[] = [
    { tier: 'free', data: FREE_TRANSLATIONS },
    { tier: 'pro', data: PRO_TRANSLATIONS },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text variant={TEXT_VARIANTS.Title3} style={styles.headerTitle}>
            {translate('reader.translation')}
          </Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <ThemedX size={22} />
          </Pressable>
        </View>

        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text variant={TEXT_VARIANTS.Overline} color="textTertiary">
                {translate(section.tier === 'free' ? 'reader.translationPicker.free' : 'reader.translationPicker.pro')}
              </Text>
            </View>
          )}
          renderItem={({ item, section }) => {
            // Pro rows are locked unless the user has Pro; tapping a locked row upsells.
            const locked = section.tier === 'pro' && !isPro;
            return (
              <Pressable
                onPress={() => (locked ? onUpsell() : onSelect(item.id))}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <View style={styles.rowContent}>
                  <Text variant={TEXT_VARIANTS.Body}>{item.label}</Text>
                  <Text variant={TEXT_VARIANTS.Caption} color="textSecondary">
                    {item.lang.toUpperCase()}
                  </Text>
                </View>
                {item.id === currentId && !locked && <ThemedCheck size={20} />}
                {locked && <ThemedLock size={16} />}
              </Pressable>
            );
          }}
          contentContainerStyle={styles.listContent}
        />
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
  listContent: {
    paddingVertical: theme.spacing[2],
  },
  sectionHeader: {
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[4],
    paddingBottom: theme.spacing[2],
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
}));
