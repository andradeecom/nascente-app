export const AI_PROMPT_TYPES = ['explain', 'explain_simple', 'chapter_summary', 'devotional', 'prayer_prompt'] as const;
export type AiPromptType = (typeof AI_PROMPT_TYPES)[number];
export const AI_PROMPT_VERSION = 6;

export type AiGenerateRequest = {
  translationId: string;
  bookId: number;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  promptType: AiPromptType;
  passageText: string;
  locale: 'en' | 'es' | 'pt';
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
