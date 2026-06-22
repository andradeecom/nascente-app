import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { ChevronDown } from 'lucide-react-native';
import { Text } from '@/components/atoms';
import { TRANSLATIONS, type TranslationId } from '@/types/bible';

type ReaderHeaderProps = {
  bookName: string | undefined;
  chapter: number;
  translationId: TranslationId;
  onBookPress: () => void;
  onTranslationPress: () => void;
};

export function ReaderHeader({ bookName, chapter, translationId, onBookPress, onTranslationPress }: ReaderHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBookPress} style={styles.bookButton}>
        <Text variant="title3" numberOfLines={1} style={styles.bookButtonText}>
          {bookName ?? '...'} {chapter}
        </Text>
        <ChevronDown size={18} color={styles.chevron.color} />
      </Pressable>

      <Pressable onPress={onTranslationPress} style={styles.translationButton}>
        <Text variant="label" color="accent">
          {TRANSLATIONS[translationId].label}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.semantic.bgTertiary,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
    flexShrink: 1,
  },
  bookButtonText: {
    flexShrink: 1,
  },
  chevron: {
    color: theme.colors.semantic.accent,
  },
  translationButton: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1.5],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.semantic.accentSubtle,
  },
}));
