import { AI_PROMPT_TYPES, AI_PROMPT_VERSION, AiGenerateError, aiCacheKey } from '../ai';

/**
 * `aiCacheKey` decides what the local AI cache considers "the same request".
 * Two failure modes matter and neither throws: a key too *coarse* serves the
 * wrong passage's explanation; a key too *fine* never hits and silently burns
 * the user's metered Gemini quota on every open.
 */

const base = ['bibliaLivre', 43, 3, 16, 16, 'explain', 'pt'] as const;

describe('aiCacheKey', () => {
  it('is stable for identical inputs', () => {
    expect(aiCacheKey(...base)).toBe(aiCacheKey(...base));
  });

  it('includes the prompt version so a bump invalidates every cached entry', () => {
    expect(aiCacheKey(...base, 7)).not.toBe(aiCacheKey(...base, 8));
    expect(aiCacheKey(...base)).toContain(`:v${AI_PROMPT_VERSION}`);
  });

  it.each<[string, Parameters<typeof aiCacheKey>]>([
    ['translation', ['rv1909', 43, 3, 16, 16, 'explain', 'pt']],
    ['book', ['bibliaLivre', 40, 3, 16, 16, 'explain', 'pt']],
    ['chapter', ['bibliaLivre', 43, 4, 16, 16, 'explain', 'pt']],
    ['verseStart', ['bibliaLivre', 43, 3, 17, 16, 'explain', 'pt']],
    ['verseEnd', ['bibliaLivre', 43, 3, 16, 17, 'explain', 'pt']],
    ['promptType', ['bibliaLivre', 43, 3, 16, 16, 'devotional', 'pt']],
    ['locale', ['bibliaLivre', 43, 3, 16, 16, 'explain', 'es']],
  ])('changes when %s changes', (_label, args) => {
    expect(aiCacheKey(...args)).not.toBe(aiCacheKey(...base));
  });

  it('produces a distinct key for every prompt type on the same passage', () => {
    // The five AI tools share a passage but must never serve each other's output.
    const keys = AI_PROMPT_TYPES.map((t) => aiCacheKey('bibliaLivre', 43, 3, 16, 16, t, 'pt'));

    expect(new Set(keys).size).toBe(AI_PROMPT_TYPES.length);
  });

  it('does not collide across adjacent numeric fields', () => {
    // A naive concatenation without separators would make (4,3) and (43) equal.
    expect(aiCacheKey('t', 4, 3, 16, 16, 'explain', 'pt')).not.toBe(aiCacheKey('t', 43, 1, 6, 16, 'explain', 'pt'));
  });

  it('ignores `reference`, which is prompt context and not part of the key', () => {
    // `reference` ("João 3:16") is passed to the model but deliberately excluded —
    // it varies with UI language and would fragment the cache for one passage.
    expect(aiCacheKey(...base)).not.toContain('João');
  });
});

describe('AI_PROMPT_VERSION', () => {
  it('is a positive integer', () => {
    // Bumping this is the documented cache-invalidation lever, and it MUST be
    // bumped in lockstep with `PROMPT_VERSION` in supabase/functions/ai-generate.
    // Jest can't reach the Deno function, so this only guards the shape.
    expect(Number.isInteger(AI_PROMPT_VERSION)).toBe(true);
    expect(AI_PROMPT_VERSION).toBeGreaterThan(0);
  });
});

describe('AiGenerateError', () => {
  it('carries the code and defaults its message to the code', () => {
    const error = new AiGenerateError('NOT_PRO');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('AiGenerateError');
    expect(error.code).toBe('NOT_PRO');
    expect(error.message).toBe('NOT_PRO');
  });

  it('keeps an explicit message', () => {
    expect(new AiGenerateError('COST_CEILING_REACHED', 'out of credits').message).toBe('out of credits');
  });
});
