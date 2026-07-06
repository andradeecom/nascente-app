import { View } from 'react-native';
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles';
import { Check } from 'lucide-react-native';
import { Button, TEXT_COLORS, TEXT_VARIANTS, Text } from '@/components/atoms';
import { AppModal } from '@/components/molecules';
import { useThemeStore } from '@/stores/theme';

type PlanDayCompleteModalProps = {
  visible: boolean;
  title: string;
  body: string;
  /** CTA label (e.g. "Continue"). */
  ctaLabel: string;
  onContinue: () => void;
};

/**
 * Celebration dialog shown when the user finishes a reading-plan day (or the
 * whole plan) via the Reader's read-through CTA — replaces the old success
 * toast so the moment feels earned. Built on `AppModal` (mirrors `UpsellModal`'s
 * shape); the single CTA both dismisses and advances the plan-completion flow.
 * Non-dismissable by backdrop/close so the completion is acknowledged explicitly.
 */
export function PlanDayCompleteModal({ visible, title, body, ctaLabel, onContinue }: PlanDayCompleteModalProps) {
  // Icon color is a plain prop (not a Unistyles-processed style), so read the
  // theme name reactively and resolve the color — same pattern as UpsellModal.
  const themeName = useThemeStore((s) => s.theme);
  const theme = UnistylesRuntime.getTheme(themeName);

  return (
    <AppModal visible={visible} onClose={onContinue} showClose={false} dismissOnBackdrop={false}>
      <View style={styles.content}>
        <View style={styles.iconBadge}>
          <Check size={26} color={theme.colors.semantic.accent} strokeWidth={2} />
        </View>
        <Text variant={TEXT_VARIANTS.Title3} style={styles.title}>
          {title}
        </Text>
        <Text variant={TEXT_VARIANTS.Callout} color={TEXT_COLORS.TextSecondary} style={styles.body}>
          {body}
        </Text>
        <Button label={ctaLabel} onPress={onContinue} fullWidth style={styles.cta} />
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
  title: {
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
  },
  cta: {
    marginTop: theme.spacing[4],
  },
}));
