export const AI_PROMPT_TYPES = ['explain', 'explain_simple', 'chapter_summary', 'devotional', 'prayer_prompt'] as const;
export type AiPromptType = (typeof AI_PROMPT_TYPES)[number];
/**
 * Cache-invalidation token for the scripture-keyed shared cache (`ai_cache`).
 * Part of every `aiCacheKey`, so bumping it makes the client miss all previously
 * cached rows and re-request — use it whenever the `ai-generate` prompt changes.
 *
 * ⚠️ MUST stay in sync with `PROMPT_VERSION` in
 * `supabase/functions/ai-generate/index.ts` — that constant keys the *server's*
 * `ai_cache` rows. The app/Deno split means the value is duplicated by hand;
 * always bump BOTH together, or the client and server key on different versions
 * (client stores under vN, server serves vN+1 → the local cache never hits).
 * Only `ai-generate` has this: it's the only function with a persistent cache.
 * `ai-plan-generate` persists nothing (free-text input, not cacheable) and
 * `revenuecat-webhook` isn't an LLM function, so neither needs a version.
 */
export const AI_PROMPT_VERSION = 7;

export type AiGenerateRequest = {
  translationId: string;
  bookId: number;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  promptType: AiPromptType;
  passageText: string;
  locale: 'en' | 'es' | 'pt';
  /**
   * Human-readable passage reference (e.g. "João 3:16") sent as prompt context
   * only — it helps the model know what it's explaining. Optional and NOT part
   * of the cache key (see `aiCacheKey`), so it never affects caching.
   */
  reference?: string;
};

export type AiGenerateResponse = {
  content: string;
  fromCache: boolean;
};

export type AiGenerateErrorCode =
  'NOT_AUTHENTICATED' | 'NOT_PRO' | 'BAD_REQUEST' | 'GEMINI_ERROR' | 'COST_CEILING_REACHED' | 'INTERNAL_ERROR';

export class AiGenerateError extends Error {
  readonly code: AiGenerateErrorCode;
  constructor(code: AiGenerateErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'AiGenerateError';
    this.code = code;
  }
}

export type CachedAiResult = {
  content: string;
  fetchedAt: string;
};

export function aiCacheKey(
  translationId: string,
  bookId: number,
  chapter: number,
  verseStart: number,
  verseEnd: number,
  promptType: AiPromptType,
  locale: string,
  promptVersion = AI_PROMPT_VERSION
): string {
  return `${translationId}:${bookId}:${chapter}:${verseStart}:${verseEnd}:${promptType}:${locale}:v${promptVersion}`;
}
