import { View } from 'react-native';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { ChevronRight, Sparkles } from 'lucide-react-native';
import { Button, TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { Card } from '../molecules';
import { useTranslate } from '@/i18n';
import { BUTTON_SIZES, BUTTON_VARIANTS } from '../atoms/Button';

const ThemedChevronRight = withUnistyles(ChevronRight, (theme) => ({ color: theme.colors.semantic.accent }));
const ThemedSparkles = withUnistyles(Sparkles, (theme) => ({ color: theme.colors.semantic.accent }));

type VerseOfTheDayCardProps = {
  title: string;
  verseText: string;
  reference: string;
  actionLabel: string;
  onPress: () => void;
  onDevotional?: () => void;
  /** Ref to the devotional button wrapper, for the first-time AI tour spotlight (see `src/hooks/use-home-screen.ts`). */
  devotionalTargetRef?: React.RefObject<View | null>;
};

export function VerseOfTheDayCard({
  title,
  verseText,
  reference,
  actionLabel,
  onPress,
  onDevotional,
  devotionalTargetRef,
}: VerseOfTheDayCardProps) {
  const translate = useTranslate();

  return (
    <Card>
      <Card.Header>
        <Text variant={TEXT_VARIANTS.Overline} color={TEXT_COLORS.TextSecondary} style={styles.uppercase}>
          {title}
        </Text>
      </Card.Header>
      <Card.Body>
        <Text variant={TEXT_VARIANTS.BodyEmphasis}>{verseText}</Text>
      </Card.Body>
      <Card.Footer style={styles.footer}>
        <Text variant={TEXT_VARIANTS.Callout} color={TEXT_COLORS.TextSecondary}>
          {reference}
        </Text>
        <Button
          onPress={onPress}
          label={actionLabel}
          variant={BUTTON_VARIANTS.Ghost}
          size={BUTTON_SIZES.Small}
          icon={<ThemedChevronRight size={16} strokeWidth={2} />}
          iconPosition="right"
        />
      </Card.Footer>
      {onDevotional ? (
        <View style={styles.devotionalButtonWrapper} ref={devotionalTargetRef}>
          <Button
            onPress={onDevotional}
            label={translate('ai.devotional.action')}
            variant={BUTTON_VARIANTS.Ghost}
            icon={<ThemedSparkles size={14} strokeWidth={1.5} />}
          />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  uppercase: {
    textTransform: 'uppercase',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  devotionalButtonWrapper: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.semantic.bgTertiary,
    paddingTop: theme.spacing[2],
    marginBottom: -8,
  },
}));
