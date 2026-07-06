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
 *   4. Check this month's ai_usage cost ceiling → reject if already at/over ceiling
 *   5. Check shared ai_cache table (scripture-keyed) → return at $0 on hit
 *   6. Call Gemini 2.5 Flash REST API
 *   7. Upsert into ai_cache (idempotent on race conditions)
 *   8. Record cost into ai_usage (cache misses only — hits are $0 and exempt)
 *   9. Return { content, fromCache: false }
 *
 * Scripture-keyed cache misses do NOT count against any *per-feature* quota
 * (shared infrastructure cost) — that's Tier B (Ask/plans/narrations, not
 * built yet). They DO count toward the per-user monthly *cost ceiling*, which
 * is a backstop against abuse independent of per-feature counters — see
 * .docs/ai-features.md §3.
 *
 * Secrets (set with `supabase secrets set`, never in the repo):
 *   - GOOGLE_GEMINI_API_KEY   Gemini REST API key
 *   - SUPABASE_URL            (auto-injected)
 *   - SUPABASE_SERVICE_ROLE_KEY (auto-injected)
 *   - SUPABASE_ANON_KEY       (auto-injected)
 */

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const PROMPT_TYPES = ['explain', 'explain_simple', 'chapter_summary', 'devotional', 'prayer_prompt'];
// Cache-invalidation token for the shared `ai_cache` table — part of the cache
// row key, so bumping it makes every previously cached result unreachable and
// forces regeneration under the new prompt. Bump whenever a systemPrompt below
// changes (last: v7, added the passage reference for context).
//
// ⚠️ MUST stay in sync with `AI_PROMPT_VERSION` in the app's `src/types/ai.ts`
// (the client bakes it into its own cache key). The app/Deno split means the
// value is duplicated by hand — always bump BOTH together. Only THIS function
// has a version because only this function has a persistent cache; ai-plan-generate
// persists nothing and revenuecat-webhook isn't an LLM function.
const PROMPT_VERSION = 7;
const LOCALES = ['en', 'es', 'pt'];
const MAX_PASSAGE_TEXT_LENGTH = 20000; // generous cap for a full chapter; blocks abuse/oversized payloads
const MAX_TRANSLATION_ID_LENGTH = 64;
const MAX_REFERENCE_LENGTH = 128; // e.g. "1 Coríntios 13:4-7" — a label, not free text

// Gemini 2.5 Flash pricing (per .docs/ai-features.md §4) — used only to estimate
// spend for the cost-ceiling backstop, not billed anywhere else.
const GEMINI_INPUT_COST_PER_TOKEN = 0.3 / 1_000_000;
const GEMINI_OUTPUT_COST_PER_TOKEN = 2.5 / 1_000_000;
const MONTHLY_COST_CEILING_USD = 1.5; // .docs/ai-features.md §3 "soft monthly cost ceiling"

// ── System prompts ──────────────────────────────────────────────────────────

const LANGUAGE_NAMES = { pt: 'Português', es: 'Español', en: 'English' };

// The passage's chapter/verse reference (e.g. "John 3:16") is added to the system
// prompt for context. Sometimes the model has trouble with the "explain" prompt
// type if it doesn't know what passage it's explaining, even though the passage
// text is included in the user prompt. `reference` is optional context only — it
// is NOT part of the cache key (coordinates + translation + locale already
// identify the passage), so a missing/changed label never affects caching.
function systemPrompt(promptType, locale, reference) {
  const lang = LANGUAGE_NAMES[locale] ?? 'Português';
  const passageLine = reference ? ` The passage is ${reference}.` : '';
  const suffix =
    `Always write in ${lang}. Always complete your full response — never cut off mid-sentence or mid-paragraph.`;

  switch (promptType) {
    case 'explain':
      return `You are a knowledgeable biblical commentator.${passageLine} When given a Bible passage, write exactly 3 complete paragraphs: (1) historical and literary context, (2) meaning and theology of the passage, (3) its significance within the broader biblical narrative. Each paragraph should be 3–5 sentences. Be accurate, reverent, and substantive. ${suffix}`;

    case 'explain_simple':
      return `You are a patient and warm Bible teacher helping someone who has never read the Bible before.${passageLine} When given a passage, write exactly 3 complete paragraphs explaining what it means in simple, everyday language — no jargon, no assumed knowledge. Use a friendly, encouraging tone. Each paragraph should be 3–4 sentences. ${suffix}`;

    case 'chapter_summary':
      return `You are a Bible study guide author.${passageLine} When given the text of a Bible chapter, write exactly 3 complete paragraphs: (1) the main events or teachings, (2) the key theological themes, (3) why this chapter matters in its broader biblical context. Each paragraph should be 3–5 sentences. Be clear and substantive. ${suffix}`;

    case 'devotional':
      return `You are a devotional writer helping readers connect Scripture to daily life.${passageLine} When given a Bible verse, write a personal reflection of 4–5 sentences on its meaning and relevance today, followed by a single journaling question that invites honest self-reflection. Separate them with a line containing only "---". ${suffix}`;

    case 'prayer_prompt':
      return `You are a prayer guide helping readers turn a Bible passage into prayer.${passageLine} When given a passage, write a short, warm prayer prompt of 3–4 sentences in the second person ("you" addressing God or reflecting on the reader's own words), rooted in the specific themes of the passage — not generic. Do not include a title or introduction, just the prayer text itself. ${suffix}`;

    default:
      return `You are a helpful Bible study assistant.${passageLine} ${suffix}`;
  }
}

function maxOutputTokens(promptType) {
  if (promptType === 'prayer_prompt') return 350;
  if (promptType === 'devotional') return 700;
  if (promptType === 'chapter_summary') return 1600;
  return 1300; // explain + explain_simple: 3 full paragraphs in Portuguese, thinking disabled
}

const CYCLE_LENGTH_MS = 30 * 24 * 60 * 60 * 1000;

// Returns the start date (YYYY-MM-DD) of the current 30-day cycle anchored to
// `proSince` (profiles.pro_since). Falls back to the calendar month if
// proSince is missing (defensive — shouldn't happen for a 'pro' row).
//
// Deliberately a fixed 30-day window, not a calendar-month anniversary: it
// drifts slightly against the calendar (~12.2 resets/year instead of 12), but
// this is a soft abuse ceiling, not billing — simplicity and correctness of
// the arithmetic matter more than exact calendar-month alignment. Don't "fix"
// this into calendar-month math without re-reading .docs/ai-features.md §3.
function currentCycleStart(proSince) {
  if (!proSince) {
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    return monthStart.toISOString().slice(0, 10);
  }

  const anchor = new Date(proSince).getTime();
  const now = Date.now();
  const cyclesElapsed = Math.floor((now - anchor) / CYCLE_LENGTH_MS);
  const cycleStart = new Date(anchor + cyclesElapsed * CYCLE_LENGTH_MS);
  return cycleStart.toISOString().slice(0, 10);
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

  const { translationId, bookId, chapter, verseStart, verseEnd, promptType, passageText, locale, reference } =
    body ?? {};

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

  // `reference` is optional prompt context (not part of the cache key). Accept a
  // bounded string; ignore anything else rather than rejecting the request.
  const referenceLabel =
    typeof reference === 'string' && reference.trim() && reference.length <= MAX_REFERENCE_LENGTH
      ? reference.trim()
      : null;

  // 2. Verify JWT
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'NOT_AUTHENTICATED' }, 401);

  const userClient = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_ANON_KEY'), {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: 'NOT_AUTHENTICATED' }, 401);

  // 3. Check Pro tier
  const { data: profile } = await userClient.from('profiles').select('tier, pro_since').eq('id', user.id).maybeSingle();
  if (profile?.tier !== 'pro') return json({ error: 'NOT_PRO', message: 'This feature requires a Pro subscription' }, 403);

  const adminClient = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

  // 4. Check this cycle's cost ceiling (backstop against abuse, independent of
  // any per-feature quota — see .docs/ai-features.md §3). The cycle is a 30-day
  // rolling window anchored to the user's Pro start date (profiles.pro_since),
  // not the calendar month — falls back to calendar-month if pro_since is unset
  // (shouldn't happen for a 'pro' row, but keeps this from throwing).
  const cycleKey = currentCycleStart(profile.pro_since);

  const { data: usage } = await adminClient
    .from('ai_usage')
    .select('cost_usd')
    .eq('user_id', user.id)
    .eq('month', cycleKey)
    .maybeSingle();

  if ((usage?.cost_usd ?? 0) >= MONTHLY_COST_CEILING_USD) {
    return json({ error: 'COST_CEILING_REACHED', message: 'Monthly AI usage limit reached' }, 429);
  }

  // 5. Check shared cache
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

  // 6. Call Gemini
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
        system_instruction: { parts: [{ text: systemPrompt(promptType, locale, referenceLabel) }] },
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

  // 7. Upsert into shared cache (idempotent on concurrent first-requests)
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

  // 8. Record cost toward this cycle's ceiling (cache misses only — hits never reach here)
  const callCost = (inputTokens ?? 0) * GEMINI_INPUT_COST_PER_TOKEN + (outputTokens ?? 0) * GEMINI_OUTPUT_COST_PER_TOKEN;

  const { error: usageError } = await adminClient.rpc('increment_ai_usage', {
    p_user_id: user.id,
    p_month: cycleKey,
    p_cost_usd: callCost,
  });

  if (usageError) {
    console.error('ai_usage increment failed', usageError);
    // Non-fatal — still return the content; worst case the ceiling under-counts this call
  }

  // 9. Return
  return json({ content: geminiContent, fromCache: false });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
