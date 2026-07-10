import * as StoreReview from 'expo-store-review';
import { useReviewPromptStore } from '@/stores/review-prompt';

/**
 * Fires the native in-app store-review prompt at most once per install, at a
 * high-satisfaction moment (finishing a reading plan, hitting a reading-streak
 * milestone). The OS itself also throttles repeat requests, but gating here
 * means we don't burn one of the OS's limited slots on a low-signal moment.
 * Call sites are fire-and-forget — never block or surface errors to the user.
 */
export async function maybeRequestReview(): Promise<void> {
  const { hasRequested, markRequested } = useReviewPromptStore.getState();
  if (hasRequested) return;

  const canAsk = await StoreReview.hasAction();
  if (!canAsk) return;

  markRequested();
  await StoreReview.requestReview();
}
