import { supabase } from '@/lib/supabase';
import { AiGenerateError, type AiGenerateRequest, type AiGenerateResponse } from '@/types/ai';

export async function callAiGenerate(request: AiGenerateRequest): Promise<AiGenerateResponse> {
  const { data, error } = await supabase.functions.invoke<AiGenerateResponse>('ai-generate', {
    body: request,
  });

  if (error) {
    // Supabase wraps non-2xx as a FunctionsHttpError with a `context` containing the body.
    // Try to extract the structured error code the Edge Function returns.
    const raw = (error as unknown as { context?: { json?: () => Promise<{ error?: string; message?: string }> } })
      .context;
    if (raw?.json) {
      try {
        const body = await raw.json();
        const code = body?.error;
        if (code === 'NOT_AUTHENTICATED' || code === 'NOT_PRO' || code === 'BAD_REQUEST' || code === 'GEMINI_ERROR') {
          throw new AiGenerateError(code, body.message);
        }
      } catch (inner) {
        if (inner instanceof AiGenerateError) throw inner;
      }
    }
    throw new AiGenerateError('INTERNAL_ERROR', error.message);
  }

  if (!data) throw new AiGenerateError('INTERNAL_ERROR', 'Empty response from ai-generate');

  return data;
}
