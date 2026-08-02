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
      // One instrumentation point covers all five prompt types. `fromCache` is the
      // property that matters: only cache misses call Gemini, cost money, and count
      // against the per-user ceiling — so the cache hit ratio here is the lever on
      // AI spend. (Server-side `$ai_generation` events carry the tokens/latency/cost
      // for the misses; see supabase/functions/ai-generate.)
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
