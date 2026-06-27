import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Sparkles, type LucideIcon } from 'lucide-react-native';
import { Button, Text, TEXT_VARIANTS } from '@/components/atoms';
import { AppModal } from '@/components/molecules';
import { BUTTON_VARIANTS } from '../atoms/Button';

type UpsellModalProps = {
  visible: boolean;
  title: string;
  description: string;
  /** Pro CTA label, e.g. "See Pro". */
  ctaLabel: string;
  onCta: () => void;
  onClose: () => void;
  /** Header icon (lucide). Defaults to Sparkles. */
  icon?: LucideIcon;
};

/**
 * Reusable upsell dialog: a centered card with an accent icon badge, title,
 * description, and a Pro CTA over a dismissable backdrop. Built on `AppModal`.
 * Used for tier-gated moments (e.g. the active-plan cap on the Plans tab).
 */
export function UpsellModal({
  visible,
  title,
  description,
  ctaLabel,
  onCta,
  onClose,
  icon: Icon = Sparkles,
}: UpsellModalProps) {
  return (
    <AppModal visible={visible} onClose={onClose}>
      <View style={styles.content}>
        <View style={styles.iconBadge}>
          <Icon size={26} color={styles.iconColor.color} strokeWidth={2} />
        </View>
        <Text variant={TEXT_VARIANTS.Title3} style={styles.title}>
          {title}
        </Text>
        <Text variant={TEXT_VARIANTS.Callout} color="textSecondary" style={styles.description}>
          {description}
        </Text>
        <Button variant={BUTTON_VARIANTS.Pro} label={ctaLabel} onPress={onCta} fullWidth style={styles.cta} />
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: {
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.semantic.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[2],
  },
  iconColor: {
    color: theme.colors.semantic.accent,
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
  },
  cta: {
    marginTop: theme.spacing[4],
  },
}));
