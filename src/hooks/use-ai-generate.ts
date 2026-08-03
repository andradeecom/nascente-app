import { useEffect } from 'react';
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

  // ── Engagement: one event per OPEN, cached or not ────────────────────────────
  //
  // This exists because the `capture()` calls inside `queryFn` below can't answer
  // "how often is this tool used?". With `initialData` recomputed from the store on
  // every render + `staleTime: Infinity`, a warm key resolves synchronously and the
  // queryFn never runs — so those events count local cache MISSES, not opens. Since
  // the local cache is persisted and never expires, a passage opened once would
  // otherwise be invisible forever after.
  //
  // Kept as a SEPARATE event rather than moving the existing captures out here: the
  // two questions are genuinely different (billed generations vs. engagement), and
  // one event trying to answer both is what makes double-counting easy to introduce.
  //
  // The cache is read imperatively via `getState()` INSIDE the effect, not from the
  // subscribed `localEntry` above. That's deliberate: the miss path writes to this
  // store, flipping the key cold → warm mid-flight, so depending on the subscribed
  // value would refire the effect and report two opens for one tap. `getState()` is
  // untracked, and the deps are the open itself — the passage key and `enabled`.
  useEffect(() => {
    if (!enabled) return;
    const fromCache = useAiCacheStore.getState().get(cacheKey) != null;
    capture('ai_tool_opened', { prompt_type: promptType, from_cache: fromCache });
  }, [enabled, cacheKey, promptType]);

  return useQuery({
    queryKey: aiKeys.generate(translationId, bookId, chapter, verseStart, verseEnd, promptType, locale),
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
    initialData: localEntry ? { content: localEntry.content, fromCache: true } : undefined,
    queryFn: async () => {
      // ⚠️ These events fire on a local cache MISS ONLY — they are "a generation was
      // requested", NOT "a tool was opened". A warm key resolves from `initialData`
      // without ever running this function (pinned in the hook's tests). Use
      // `ai_tool_opened` (captured in the effect above) for engagement questions.
      //
      // That split is deliberate and worth keeping: only misses call Gemini, cost
      // money, and count against the per-user ceiling, so these events line up 1:1
      // with spend. Server-side `$ai_generation` carries the tokens/latency/cost for
      // the same calls (see functions/ai-generate). `promptType` distinguishes the
      // five tools on both sides.
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
