// @ts-nocheck — Deno edge function; type-checked by Deno at deploy, not the app's tsserver.
import { PostHog } from 'npm:posthog-node@4';

/**
 * PostHog for the AI Edge Functions — the server half of the analytics setup.
 *
 * **Why AI observability lives here and not in the app:** `$ai_generation` is about
 * tokens, latency and cost, and those values only exist where the model is actually
 * called. The client never sees them. Sending them to the device just to report them
 * back would be more moving parts, less reliable, and trivially falsifiable.
 *
 * Uses the SAME project API key as the app (`EXPO_PUBLIC_POSTHOG_API_KEY` there,
 * `POSTHOG_API_KEY` here) and the same distinct id (the Supabase `auth.users.id`),
 * so a user's in-app behaviour and their AI cost land on one timeline.
 *
 * Set the secrets with:
 *   supabase secrets set POSTHOG_API_KEY="phc_..." POSTHOG_HOST="https://eu.i.posthog.com"
 *
 * No key configured → every helper no-ops, exactly like the app's `lib/posthog.ts`,
 * so a function still works normally without analytics.
 */

const apiKey = Deno.env.get('POSTHOG_API_KEY');
const host = Deno.env.get('POSTHOG_HOST') ?? 'https://eu.i.posthog.com';

/**
 * A fresh client per invocation. Edge isolates are short-lived and frozen after the
 * response, so a module-level client shared across requests would batch events it
 * never gets to flush. `flushAt: 1` / `flushInterval: 0` disable batching outright —
 * in a serverless context a batch is just a way to lose events.
 */
export function createPostHog() {
  if (!apiKey) return null;
  return new PostHog(apiKey, { host, flushAt: 1, flushInterval: 0 });
}

/**
 * Capture an LLM call as a PostHog `$ai_generation`, the event that powers the
 * LLM analytics product (cost, latency, error rate, per-model breakdown).
 *
 * Gemini has no first-party PostHog wrapper, so these properties are set manually
 * per PostHog's manual-capture schema. Cost is derived server-side by PostHog from
 * `$ai_model` + the token counts — we deliberately don't send a cost of our own;
 * the function's `ai_usage` accounting stays the authority for the spend ceiling.
 *
 * **Deliberately omits `$ai_input` / `$ai_output_choices`.** Those would ship the
 * scripture passage and the generated devotional/prayer text to PostHog. None of
 * the cost, latency or reliability questions need them.
 */
export function captureAiGeneration(
  posthog,
  {
    distinctId,
    model,
    inputTokens,
    outputTokens,
    latencySeconds,
    promptType,
    locale,
    isError = false,
    error,
    traceId,
  }
) {
  if (!posthog) return;

  posthog.capture({
    distinctId,
    event: '$ai_generation',
    properties: {
      $ai_trace_id: traceId ?? crypto.randomUUID(),
      $ai_model: model,
      $ai_provider: 'gemini',
      $ai_input_tokens: inputTokens ?? 0,
      $ai_output_tokens: outputTokens ?? 0,
      $ai_latency: latencySeconds,
      $ai_is_error: isError,
      ...(error ? { $ai_error: error } : {}),
      // Custom dimensions — which AI tool and which market, so cost can be broken
      // down by feature (the thing `ai_usage` alone can't tell us).
      prompt_type: promptType,
      locale,
    },
  });
}

/**
 * Flush and shut down before responding.
 *
 * **This is the step that makes or breaks the integration.** A Supabase edge isolate
 * is frozen once the response is returned, so anything still buffered is silently
 * dropped — the failure mode is "no events, no error". Always `await` this on every
 * path out of a handler that captured something, including error paths.
 */
export async function flushPostHog(posthog) {
  if (!posthog) return;
  try {
    await posthog.shutdown();
  } catch {
    // Never let an analytics failure change the function's result.
  }
}
