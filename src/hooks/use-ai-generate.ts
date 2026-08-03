import { useQuery } from '@tanstack/react-query';
import { useAiCacheStore } from '@/stores/ai-cache';
import { callAiGenerate } from '@/services/ai';
import { aiCacheKey, AiGenerateError, type AiGenerateRequest } from '@/types/ai';
import { capture } from '@/lib/posthog';

export const aiKeys = {
  generate: (
    translationId: string,
    bookId: number,
    chapter: number,
    verseStart: number,
    verseEnd: number,
    promptType: AiGenerateRequest['promptType'],
    locale: AiGenerateRequest['locale']
  ) => ['ai', 'generate', translationId, bookId, chapter, verseStart, verseEnd, promptType, locale] as const,
};

type UseAiGenerateParams = AiGenerateRequest & {
  enabled: boolean;
};

export function useAiGenerate({
  translationId,
  bookId,
  chapter,
  verseStart,
  verseEnd,
  promptType,
  passageText,
  locale,
  reference,
  enabled,
}: UseAiGenerateParams) {
  const cacheKey = aiCacheKey(translationId, bookId, chapter, verseStart, verseEnd, promptType, locale);
  const localCacheGet = useAiCacheStore((s) => s.get);
  const localCacheSet = useAiCacheStore((s) => s.set);

  const localEntry = localCacheGet(cacheKey);

  return useQuery({
    queryKey: aiKeys.generate(translationId, bookId, chapter, verseStart, verseEnd, promptType, locale),
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
    initialData: localEntry ? { content: localEntry.content, fromCache: true } : undefined,
    queryFn: async () => {
      // One instrumentation point covers all five prompt types — `promptType` is
      // what tells verse-explain from chapter-summary/devotional/prayer downstream.
      //
      // `fromCache` is the property that matters: only cache misses call Gemini, cost
      // money, and count against the per-user ceiling. (Server-side `$ai_generation`
      // events carry tokens/latency/cost for those misses; see functions/ai-generate.)
      //
      // This DOES run on a local-cache hit: the sheets mount with `enabled: false` and
      // flip true on open, so opening a cached passage still executes the query rather
      // than resolving synchronously from `initialData`. Verified on-device — don't
      // "fix" a perceived missing-hit-event by also capturing in an effect, which
      // would double-count every hit.
      capture('ai_generate_requested', { prompt_type: promptType });

      const cached = localCacheGet(cacheKey);
      if (cached) {
        capture('ai_generate_succeeded', { prompt_type: promptType, from_cache: true });
        return { content: cached.content, fromCache: true };
      }

      try {
        const result = await callAiGenerate({
          translationId,
          bookId,
          chapter,
          verseStart,
          verseEnd,
          promptType,
          passageText,
          locale,
          reference,
        });

        localCacheSet(cacheKey, { content: result.content, fetchedAt: new Date().toISOString() });
        // `result.fromCache` distinguishes a server-cache hit (shared across users,
        // still free) from a real generation — a local miss can still be either.
        capture('ai_generate_succeeded', { prompt_type: promptType, from_cache: result.fromCache });
        return result;
      } catch (error) {
        // The typed error code is the useful signal — COST_CEILING_REACHED tells us
        // a Pro user ran out of AI budget, which is a product problem, not a bug.
        capture('ai_generate_failed', {
          prompt_type: promptType,
          code: error instanceof AiGenerateError ? error.code : 'UNKNOWN',
        });
        throw error;
      }
    },
  });
}
