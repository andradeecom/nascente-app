import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { ChevronRight, Sparkles } from 'lucide-react-native';
import { Button, Text, TEXT_VARIANTS } from '@/components/atoms';
import { Card } from '../molecules';
import { useTranslate } from '@/i18n';
import { BUTTON_SIZES, BUTTON_VARIANTS } from '../atoms/Button';

type VerseOfTheDayCardProps = {
  title: string;
  verseText: string;
  reference: string;
  actionLabel: string;
  onPress: () => void;
  onDevotional?: () => void;
};

export function VerseOfTheDayCard({
  title,
  verseText,
  reference,
  actionLabel,
  onPress,
  onDevotional,
}: VerseOfTheDayCardProps) {
  const translate = useTranslate();

  return (
    <Card>
      <Card.Header>
        <Text variant={TEXT_VARIANTS.Overline} color="textSecondary" style={styles.uppercase}>
          {title}
        </Text>
      </Card.Header>
      <Card.Body>
        <Text variant={TEXT_VARIANTS.BodyEmphasis}>{verseText}</Text>
      </Card.Body>
      <Card.Footer style={styles.footer}>
        <Text variant={TEXT_VARIANTS.Callout} color="textSecondary">
          {reference}
        </Text>
        <Button
          onPress={onPress}
          label={actionLabel}
          variant={BUTTON_VARIANTS.Ghost}
          size={BUTTON_SIZES.Small}
          icon={<ChevronRight size={16} color={styles.accentColor.color} strokeWidth={2} />}
          iconPosition="right"
        />
      </Card.Footer>
      {onDevotional ? (
        <View style={styles.devotionalButtonWrapper}>
          <Button
            onPress={onDevotional}
            label={translate('ai.devotional.action')}
            variant={BUTTON_VARIANTS.Ghost}
            icon={<Sparkles size={14} color={styles.accentColor.color} strokeWidth={1.5} />}
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
  accentColor: {
    color: theme.colors.semantic.accent,
  },
  devotionalButtonWrapper: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.semantic.bgTertiary,
    paddingTop: theme.spacing[2],
    marginBottom: -8,
  },
}));
