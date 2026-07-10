import * as Haptics from 'expo-haptics';

/**
 * Central haptic-feedback tiers, keyed to interaction significance rather than
 * exposing raw `expo-haptics` calls at each call site — keeps the "how much
 * feedback is too much" decision in one place. Fire-and-forget: callers don't
 * await these.
 */

/** Tier 1 — selection/light: toggles, list/picker choices, tab-like selection changes. */
export function hapticSelect(): void {
  void Haptics.selectionAsync();
}

/** Tier 2 — confirmation: saving a highlight/note, bookmark toggle, sheet/modal primary action. */
export function hapticConfirm(): void {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/** Tier 3 — success/milestone: plan day/plan complete, other "you did it" moments. */
export function hapticSuccess(): void {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** Tier 4 — warning/error: destructive confirmations, failed generation. */
export function hapticWarning(): void {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}
