import { View } from 'react-native';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { Crown } from 'lucide-react-native';
import { Text, TEXT_VARIANTS } from './Text';

// `warning`/`warningForeground` differ per theme (gold tone + its foreground), so
// the icon's color/fill are bound via `withUnistyles` (module scope) rather than
// read off `styles.X.color` — a leaf icon prop isn't Unistyles-processed and would
// freeze at first render, never repainting on a live theme switch.
const ThemedCrown = withUnistyles(Crown, (theme) => ({
  color: theme.colors.warningForeground,
  fill: theme.colors.warningForeground,
}));

type ProBadgeProps = {
  label: string;
};

/**
 * Small gold "PRO" status pill — for a signed-in Pro user's own account (profile
 * screen), not a Pro upsell. Deliberately gold (the existing `warning` token,
 * already used for the paywall's "Economize 33%" badge), not the app's accent
 * blue used everywhere else for Pro *nudges* (`ProLockCard`, `UpsellModal`,
 * `Sparkles`) — this reads as "you have this," not "you could get this."
 */
export function ProBadge({ label }: ProBadgeProps) {
  return (
    <View style={styles.badge}>
      <ThemedCrown size={12} strokeWidth={2.5} />
      <Text variant={TEXT_VARIANTS.Overline} style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
    backgroundColor: theme.colors.semantic.warning,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[0.5],
  },
  label: {
    color: theme.colors.warningForeground,
    fontWeight: theme.font.weights.bold,
  },
}));
