import { View } from 'react-native';
import { PressableScale } from 'pressto';
import { StyleSheet } from 'react-native-unistyles';
import { Bookmark, NotebookPen } from 'lucide-react-native';
import { Text, TEXT_VARIANTS } from '@/components/atoms';
import { highlights as HIGHLIGHT_HEX } from '@/theme/colors';
import type { StudyItem } from '@/app/(tabs)/study/use-study-screen';

type StudyCardProps = {
  item: StudyItem;
  onPress?: () => void;
};

export function StudyCard({ item, onPress }: StudyCardProps) {
  return (
    <PressableScale onPress={onPress} style={styles.card} accessibilityRole="button">
      <View style={styles.leading}>
        {item.type === 'highlight' && item.color ? (
          <View style={[styles.colorDot, { backgroundColor: HIGHLIGHT_HEX[item.color] }]} />
        ) : item.type === 'bookmark' ? (
          <Bookmark size={16} color={styles.iconAccent.color} strokeWidth={2} fill={styles.iconAccent.color} />
        ) : (
          <NotebookPen size={16} color={styles.iconAccent.color} strokeWidth={2} />
        )}
      </View>
      <View style={styles.cardBody}>
        <Text variant={TEXT_VARIANTS.Label} color="accent">
          {item.reference}
        </Text>
        {item.type === 'note' ? (
          <>
            <Text variant={TEXT_VARIANTS.Callout} numberOfLines={3}>
              {item.body}
            </Text>
            <Text variant={TEXT_VARIANTS.Caption} color="textTertiary" numberOfLines={1}>
              {item.text}
            </Text>
          </>
        ) : (
          <Text variant={TEXT_VARIANTS.Callout} color="textSecondary" numberOfLines={3}>
            {item.text}
          </Text>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flexDirection: 'row',
    gap: theme.spacing[3],
    backgroundColor: theme.colors.semantic.bgPrimary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing[4],
    ...theme.shadows.sm,
  },
  leading: {
    width: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  iconAccent: {
    color: theme.colors.semantic.accent,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: theme.radius.full,
  },
  cardBody: {
    flex: 1,
    gap: theme.spacing[1],
  },
}));
