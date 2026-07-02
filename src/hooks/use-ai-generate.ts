import { useQuery } from '@tanstack/react-query';
import { useAiCacheStore } from '@/stores/ai-cache';
import { callAiGenerate } from '@/services/ai';
import { aiCacheKey, type AiGenerateRequest } from '@/types/ai';

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
      const cached = localCacheGet(cacheKey);
      if (cached) return { content: cached.content, fromCache: true };

      const result = await callAiGenerate({
        translationId,
        bookId,
        chapter,
        verseStart,
        verseEnd,
        promptType,
        passageText,
        locale,
      });

      localCacheSet(cacheKey, { content: result.content, fetchedAt: new Date().toISOString() });
      return result;
    },
  });
}
