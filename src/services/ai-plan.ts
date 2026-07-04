import { supabase } from '@/lib/supabase';
import { AiPlanGenerateError, type AiPlanGenerateRequest, type AiPlanPreview } from '@/types/ai-plan';

/**
 * Calls the ai-plan-generate Edge Function to generate a plan PREVIEW (not saved).
 * Mirrors services/ai.ts's structured-error extraction. The generation itself
 * counts against the user's monthly quota (charged server-side), even if the
 * user later discards the preview.
 */
export async function callAiPlanGenerate(request: AiPlanGenerateRequest): Promise<AiPlanPreview> {
  const { data, error } = await supabase.functions.invoke<AiPlanPreview>('ai-plan-generate', {
    body: request,
  });

  if (error) {
    const raw = (
      error as unknown as {
        context?: { json?: () => Promise<{ error?: string; message?: string; resetAt?: string }> };
      }
    ).context;
    if (raw?.json) {
      try {
        const body = await raw.json();
        const code = body?.error;
        if (
          code === 'NOT_AUTHENTICATED' ||
          code === 'NOT_PRO' ||
          code === 'BAD_REQUEST' ||
          code === 'GEMINI_ERROR' ||
          code === 'AI_PLAN_LIMIT_REACHED' ||
          code === 'COST_CEILING_REACHED'
        ) {
          throw new AiPlanGenerateError(code, body.message, body.resetAt);
        }
      } catch (inner) {
        if (inner instanceof AiPlanGenerateError) throw inner;
      }
    }
    throw new AiPlanGenerateError('INTERNAL_ERROR', error.message);
  }

  if (!data) throw new AiPlanGenerateError('INTERNAL_ERROR', 'Empty response from ai-plan-generate');

  return data;
}
