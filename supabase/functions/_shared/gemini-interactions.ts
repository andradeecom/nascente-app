// @ts-nocheck — Deno edge function helper; type-checked by Deno at deploy, not the app's tsserver.

/**
 * Shared helpers for calling the Gemini Interactions API from Supabase Edge
 * Functions. Everything here is pure JS / JSON-shaped so it can also be unit
 * tested with Jest.
 *
 * References:
 * - Interactions API: https://ai.google.dev/gemini-api/docs/interactions
 * - Interactions REST field names are snake_case; camelCase returns 400.
 */

export const GEMINI_MODEL = 'gemini-3.8-flash';
export const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';

// Google paid-tier pricing for gemini-3.8-flash through 2026-12-31.
// From 2027-01-01 the prices double: $1.50 input / $7.50 output per 1M tokens.
export const GEMINI_INPUT_COST_PER_TOKEN = 0.75 / 1_000_000;
export const GEMINI_OUTPUT_COST_PER_TOKEN = 3.75 / 1_000_000;

/**
 * Build a request body for the Interactions API.
 *
 * All keys are snake_case because the REST endpoint rejects camelCase fields.
 */
export function buildInteractionsRequest({
  model = GEMINI_MODEL,
  systemInstruction,
  input,
  store = false,
  responseFormat = null,
  generationConfig,
}) {
  const body = {
    model,
    system_instruction: systemInstruction,
    input,
    store,
    generation_config: generationConfig,
  };

  if (responseFormat) {
    body.response_format = responseFormat;
  }

  return body;
}

/**
 * Extract the final text from an Interactions API response.
 *
 * The response is an Interaction resource with a `steps` timeline. We look for
 * the last `model_output` step and concatenate consecutive text parts.
 */
export function extractTextFromInteraction(interactionJson) {
  const modelOutputStep = interactionJson?.steps?.findLast?.((step) => step.type === 'model_output');
  const textParts = modelOutputStep?.content?.filter?.((part) => part.type === 'text');
  return textParts?.length ? textParts.map((part) => part.text).join('') : null;
}

/**
 * Read token usage from an Interactions API response.
 *
 * Output tokens include thinking tokens, which matches how Gemini 3.8 Flash bills.
 */
export function extractUsageFromInteraction(interactionJson) {
  return {
    inputTokens: interactionJson?.usage?.total_input_tokens ?? null,
    outputTokens: interactionJson?.usage?.total_output_tokens ?? null,
  };
}

/**
 * Estimate the dollar cost of a Gemini 3.8 Flash call.
 */
export function calculateGeminiCost(inputTokens, outputTokens) {
  return (inputTokens ?? 0) * GEMINI_INPUT_COST_PER_TOKEN + (outputTokens ?? 0) * GEMINI_OUTPUT_COST_PER_TOKEN;
}
