import { callAiGenerate } from '../ai';
import { AiGenerateError, type AiGenerateRequest } from '@/types/ai';
import { supabase } from '@/lib/supabase';

/**
 * `callAiGenerate` translates the Edge Function's structured error body into a
 * typed `AiGenerateError`. The extraction is a nested try/catch over a
 * `FunctionsHttpError`'s lazily-parsed `context` — easy to get subtly wrong in a
 * way that swallows a real error and reports a generic INTERNAL_ERROR instead,
 * which would make quota/tier problems undiagnosable in PostHog.
 */

jest.mock('@/lib/supabase', () => ({
  supabase: { functions: { invoke: jest.fn() } },
}));

const invoke = supabase.functions.invoke as jest.Mock;

const request: AiGenerateRequest = {
  translationId: 'bibliaLivre',
  bookId: 43,
  chapter: 3,
  verseStart: 16,
  verseEnd: 16,
  promptType: 'explain',
  passageText: 'Porque Deus amou o mundo de tal maneira…',
  locale: 'pt',
};

/** Shape of a Supabase `FunctionsHttpError`: the body is behind a lazy `context.json()`. */
function httpError(body: unknown, message = 'Edge Function returned a non-2xx status code') {
  return { message, context: { json: jest.fn().mockResolvedValue(body) } };
}

describe('callAiGenerate', () => {
  it('returns the data on success', async () => {
    invoke.mockResolvedValue({ data: { content: 'explanation', fromCache: false }, error: null });

    await expect(callAiGenerate(request)).resolves.toEqual({ content: 'explanation', fromCache: false });
  });

  it('passes the request through as the function body', async () => {
    invoke.mockResolvedValue({ data: { content: 'x', fromCache: true }, error: null });

    await callAiGenerate(request);

    expect(invoke).toHaveBeenCalledWith('ai-generate', { body: request });
  });

  it.each([['NOT_AUTHENTICATED'], ['NOT_PRO'], ['BAD_REQUEST'], ['GEMINI_ERROR'], ['COST_CEILING_REACHED']] as const)(
    'maps the %s error body to a typed AiGenerateError',
    async (code) => {
      invoke.mockResolvedValue({ data: null, error: httpError({ error: code, message: 'nope' }) });

      await expect(callAiGenerate(request)).rejects.toMatchObject({
        name: 'AiGenerateError',
        code,
        message: 'nope',
      });
    }
  );

  it('falls back to INTERNAL_ERROR for an unrecognised error code', async () => {
    // A newly-added server code the client doesn't know yet must not be silently
    // reported as one of the known ones.
    invoke.mockResolvedValue({ data: null, error: httpError({ error: 'SOME_NEW_CODE', message: 'huh' }) });

    await expect(callAiGenerate(request)).rejects.toMatchObject({ code: 'INTERNAL_ERROR' });
  });

  it('falls back to INTERNAL_ERROR when the error has no parseable context', async () => {
    invoke.mockResolvedValue({ data: null, error: { message: 'network down' } });

    await expect(callAiGenerate(request)).rejects.toMatchObject({
      code: 'INTERNAL_ERROR',
      message: 'network down',
    });
  });

  it('falls back to INTERNAL_ERROR when context.json() itself rejects', async () => {
    // The inner catch re-throws only `AiGenerateError`; a JSON parse failure must
    // fall through to the generic error rather than escaping as a raw rejection.
    const error = { message: 'bad body', context: { json: jest.fn().mockRejectedValue(new Error('not json')) } };
    invoke.mockResolvedValue({ data: null, error });

    await expect(callAiGenerate(request)).rejects.toMatchObject({ code: 'INTERNAL_ERROR' });
  });

  it('uses the code as the message when the body omits one', async () => {
    invoke.mockResolvedValue({ data: null, error: httpError({ error: 'NOT_PRO' }) });

    await expect(callAiGenerate(request)).rejects.toMatchObject({ code: 'NOT_PRO', message: 'NOT_PRO' });
  });

  it('throws INTERNAL_ERROR on an empty 2xx response', async () => {
    invoke.mockResolvedValue({ data: null, error: null });

    await expect(callAiGenerate(request)).rejects.toMatchObject({
      code: 'INTERNAL_ERROR',
      message: 'Empty response from ai-generate',
    });
  });

  it('always rejects with an AiGenerateError instance, never a raw error', async () => {
    // Call sites (`useAiGenerate`'s catch, the sheets) branch on `instanceof`.
    invoke.mockResolvedValue({ data: null, error: httpError({ error: 'GEMINI_ERROR' }) });

    await expect(callAiGenerate(request)).rejects.toBeInstanceOf(AiGenerateError);
  });
});
