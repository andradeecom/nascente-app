// @ts-nocheck — Deno edge function; type-checked by Deno at deploy, not the app's tsserver.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * AI content generation — scripture-keyed, shared-cached, Pro-only.
 *
 * Flow:
 *   1. Parse + validate request body
 *   2. Verify JWT via userClient.auth.getUser()
 *   3. Check profiles.tier === 'pro'
 *   4. Check shared ai_cache table (scripture-keyed) → return at $0 on hit
 *   5. Call Gemini 2.5 Flash REST API
 *   6. Upsert into ai_cache (idempotent on race conditions)
 *   7. Return { content, fromCache: false }
 *
 * Scripture-keyed cache misses do NOT count against the requesting user's quota
 * (shared infrastructure cost). Quota tracking for user-keyed calls is Tier B.
 *
 * Secrets (set with `supabase secrets set`, never in the repo):
 *   - GOOGLE_GEMINI_API_KEY   Gemini REST API key
 *   - SUPABASE_URL            (auto-injected)
 *   - SUPABASE_SERVICE_ROLE_KEY (auto-injected)
 *   - SUPABASE_ANON_KEY       (auto-injected)
 */

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const PROMPT_TYPES = ['explain', 'explain_simple', 'chapter_summary', 'devotional'];
const PROMPT_VERSION = 5;
const LOCALES = ['en', 'es', 'pt'];
const MAX_PASSAGE_TEXT_LENGTH = 20000; // generous cap for a full chapter; blocks abuse/oversized payloads
const MAX_TRANSLATION_ID_LENGTH = 64;

// ── System prompts ──────────────────────────────────────────────────────────

const LANGUAGE_NAMES = { pt: 'Português', es: 'Español', en: 'English' };

function systemPrompt(promptType, locale) {
  const lang = LANGUAGE_NAMES[locale] ?? 'Português';
  const suffix = `Always write in ${lang}. Always complete your full response — never cut off mid-sentence or mid-paragraph.`;

  switch (promptType) {
    case 'explain':
      return `You are a knowledgeable biblical commentator. When given a Bible passage, write exactly 3 complete paragraphs: (1) historical and literary context, (2) meaning and theology of the passage, (3) its significance within the broader biblical narrative. Each paragraph should be 3–5 sentences. Be accurate, reverent, and substantive. ${suffix}`;

    case 'explain_simple':
      return `You are a patient and warm Bible teacher helping someone who has never read the Bible before. When given a passage, write exactly 3 complete paragraphs explaining what it means in simple, everyday language — no jargon, no assumed knowledge. Use a friendly, encouraging tone. Each paragraph should be 3–4 sentences. ${suffix}`;

    case 'chapter_summary':
      return `You are a Bible study guide author. When given the text of a Bible chapter, write exactly 3 complete paragraphs: (1) the main events or teachings, (2) the key theological themes, (3) why this chapter matters in its broader biblical context. Each paragraph should be 3–5 sentences. Be clear and substantive. ${suffix}`;

    case 'devotional':
      return `You are a devotional writer helping readers connect Scripture to daily life. When given a Bible verse, write a personal reflection of 4–5 sentences on its meaning and relevance today, followed by a single journaling question that invites honest self-reflection. Separate them with a line containing only "---". ${suffix}`;

    default:
      return `You are a helpful Bible study assistant. ${suffix}`;
  }
}

function maxOutputTokens(promptType) {
  if (promptType === 'devotional') return 700;
  if (promptType === 'chapter_summary') return 1600;
  return 1300; // explain + explain_simple: 3 full paragraphs in Portuguese, thinking disabled
}

// ── Main handler ────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    return await handleRequest(req);
  } catch (err) {
    console.error('Unhandled error in ai-generate', err);
    return json({ error: 'INTERNAL_ERROR', message: 'Something went wrong' }, 500);
  }
});

async function handleRequest(req) {
  if (req.method !== 'POST') {
    return json({ error: 'METHOD_NOT_ALLOWED' }, 405);
  }

  // 1. Parse body
  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'BAD_REQUEST', message: 'Invalid JSON' }, 400);
  }

  const { translationId, bookId, chapter, verseStart, verseEnd, promptType, passageText, locale } = body ?? {};

  const isValidInt = (n) => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 200000;

  if (
    typeof translationId !== 'string' ||
    !translationId.trim() ||
    translationId.length > MAX_TRANSLATION_ID_LENGTH ||
    !isValidInt(bookId) ||
    !isValidInt(chapter) ||
    !isValidInt(verseStart) ||
    !isValidInt(verseEnd) ||
    !PROMPT_TYPES.includes(promptType) ||
    typeof passageText !== 'string' ||
    !passageText.trim() ||
    passageText.length > MAX_PASSAGE_TEXT_LENGTH ||
    !LOCALES.includes(locale)
  ) {
    return json({ error: 'BAD_REQUEST', message: 'Missing or invalid fields' }, 400);
  }

  // 2. Verify JWT
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'NOT_AUTHENTICATED' }, 401);

  const userClient = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_ANON_KEY'), {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: 'NOT_AUTHENTICATED' }, 401);

  // 3. Check Pro tier
  const { data: profile } = await userClient.from('profiles').select('tier').eq('id', user.id).maybeSingle();
  if (profile?.tier !== 'pro') return json({ error: 'NOT_PRO', message: 'This feature requires a Pro subscription' }, 403);

  // 4. Check shared cache
  const adminClient = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

  const { data: cached } = await adminClient
    .from('ai_cache')
    .select('content')
    .eq('translation_id', translationId)
    .eq('book_id', bookId)
    .eq('chapter', chapter)
    .eq('verse_start', verseStart)
    .eq('verse_end', verseEnd)
    .eq('prompt_type', promptType)
    .eq('prompt_version', PROMPT_VERSION)
    .eq('locale', locale)
    .maybeSingle();

  if (cached?.content) {
    return json({ content: cached.content, fromCache: true });
  }

  // 5. Call Gemini
  const geminiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
  if (!geminiKey) {
    console.error('GOOGLE_GEMINI_API_KEY not set');
    return json({ error: 'INTERNAL_ERROR', message: 'AI provider not configured' }, 500);
  }

  let geminiContent;
  let inputTokens = null;
  let outputTokens = null;

  try {
    const geminiRes = await fetch(`${GEMINI_ENDPOINT}?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt(promptType, locale) }] },
        contents: [{ role: 'user', parts: [{ text: passageText }] }],
        generationConfig: {
          maxOutputTokens: maxOutputTokens(promptType),
          temperature: 0.7,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      console.error('Gemini error', geminiRes.status, errBody);
      return json({ error: 'GEMINI_ERROR', message: 'AI generation failed' }, 503);
    }

    const geminiJson = await geminiRes.json();
    const candidate = geminiJson?.candidates?.[0];
    geminiContent = candidate?.content?.parts?.[0]?.text;
    inputTokens = geminiJson?.usageMetadata?.promptTokenCount ?? null;
    outputTokens = geminiJson?.usageMetadata?.candidatesTokenCount ?? null;

    const finishReason = candidate?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
      console.warn(`Gemini finishReason=${finishReason} outputTokens=${outputTokens} promptType=${promptType}`);
    }

    if (!geminiContent) {
      console.error('Unexpected Gemini response shape', JSON.stringify(geminiJson));
      return json({ error: 'GEMINI_ERROR', message: 'Empty AI response' }, 503);
    }
  } catch (err) {
    console.error('Gemini fetch failed', err);
    return json({ error: 'GEMINI_ERROR', message: 'AI generation failed' }, 503);
  }

  // 6. Upsert into shared cache (idempotent on concurrent first-requests)
  const { error: upsertError } = await adminClient.from('ai_cache').upsert(
    {
      translation_id: translationId,
      book_id: bookId,
      chapter,
      verse_start: verseStart,
      verse_end: verseEnd,
      prompt_type: promptType,
      prompt_version: PROMPT_VERSION,
      locale,
      content: geminiContent,
      model: GEMINI_MODEL,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
    },
    { onConflict: 'translation_id,book_id,chapter,verse_start,verse_end,prompt_type,prompt_version,locale' }
  );

  if (upsertError) {
    console.error('ai_cache upsert failed', upsertError);
    // Still return the content — the cache miss is non-fatal
  }

  // 7. Return
  return json({ content: geminiContent, fromCache: false });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
