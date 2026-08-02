// @ts-nocheck — Deno edge function; type-checked by Deno at deploy, not the app's tsserver.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { createPostHog, captureAiGeneration, flushPostHog } from '../_shared/posthog.ts';

/**
 * AI reading-plan generator — user-keyed, metered, Pro-only.
 *
 * Unlike ai-generate (scripture-keyed, shared-cached, returns one string), this
 * takes a free-text topic + duration and returns a STRUCTURED plan (title,
 * description, per-day book/chapter refs). It does NOT persist anything — the
 * client shows a preview and, only on explicit confirm, inserts the plan itself
 * (RLS-scoped owner insert; see the app's use-ai-plan-generate hook). Generation
 * is what costs tokens, so the quota is charged HERE, at generation time —
 * a preview the user discards still counts.
 *
 * Flow:
 *   1. Parse + validate { topic, days, locale }
 *   2. Verify JWT, check profiles.tier === 'pro'
 *   3. Check the per-user AI-plan quota (ai_plan_usage, 10 / 30-day cycle) AND
 *      the global dollar cost ceiling (ai_usage) — reject if either is hit
 *   4. Call Gemini asking for strict JSON
 *   5. Parse + VALIDATE every day's book_id (1–66) and chapters against the
 *      canonical chapter-count table — reject if the model hallucinated a ref
 *   6. Increment BOTH counters (ai_plan_usage count + ai_usage dollar cost)
 *   7. Return the validated plan preview (NOT saved) → { title, description, days }
 *
 * Secrets: GOOGLE_GEMINI_API_KEY, plus the auto-injected SUPABASE_* keys.
 */

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const LOCALES = ['en', 'es', 'pt'];
const MIN_DAYS = 3;
const MAX_DAYS = 40;
const MAX_TOPIC_LENGTH = 200;

// Gemini 2.5 Flash pricing (per .docs/ai-features.md §4) — cost-ceiling estimate only.
const GEMINI_INPUT_COST_PER_TOKEN = 0.3 / 1_000_000;
const GEMINI_OUTPUT_COST_PER_TOKEN = 2.5 / 1_000_000;
const MONTHLY_COST_CEILING_USD = 1.5; // .docs/ai-features.md §3
const AI_PLAN_LIMIT = 10; // .docs/ai-features.md §3 — 10 AI plans per cycle

// Canonical chapter counts for the 66-book Protestant canon, indexed by book_id
// (1 = Genesis … 66 = Revelation). Used to reject any hallucinated book/chapter
// the model returns. This mirrors the bundled SQLite data (book_id is stable
// across all bundled translations).
const CHAPTER_COUNTS = [
  50, 40, 27, 36, 34, 24, 21, 4, 31, 24, 22, 25, 29, 36, 10, 13, 10, 42, 150, 31, 12, 8, 66, 52, 5, 48, 12, 14, 3, 9,
  1, 4, 7, 3, 3, 3, 2, 14, 4, 28, 16, 24, 21, 28, 16, 16, 13, 6, 6, 4, 4, 5, 3, 6, 4, 3, 1, 13, 5, 5, 3, 5, 1, 1, 1,
  22,
];

const CYCLE_LENGTH_MS = 30 * 24 * 60 * 60 * 1000;

// Start date (YYYY-MM-DD) of the current 30-day cycle anchored to proSince
// (profiles.pro_since). Same logic as ai-generate's currentCycleStart — keep in
// sync. Falls back to the calendar month if proSince is missing.
function currentCycleStart(proSince) {
  if (!proSince) {
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    return monthStart.toISOString().slice(0, 10);
  }
  const anchor = new Date(proSince).getTime();
  const cyclesElapsed = Math.floor((Date.now() - anchor) / CYCLE_LENGTH_MS);
  return new Date(anchor + cyclesElapsed * CYCLE_LENGTH_MS).toISOString().slice(0, 10);
}

// When the current cycle resets (its start + 30 days), as a YYYY-MM-DD string.
// Sent on quota-reached responses so the app can show "resets in N days".
function cycleResetAt(cycleStart) {
  return new Date(new Date(`${cycleStart}T00:00:00Z`).getTime() + CYCLE_LENGTH_MS).toISOString().slice(0, 10);
}

const LANGUAGE_NAMES = { pt: 'Português', es: 'Español', en: 'English' };

function systemPrompt(days, locale) {
  const lang = LANGUAGE_NAMES[locale] ?? 'Português';
  return `You are a thoughtful Bible reading-plan designer. Given a topic, feeling, or learning goal from the user, design a ${days}-day reading plan that walks through relevant Bible passages.

Return ONLY valid JSON (no markdown fences, no prose) with this exact shape:
{
  "title": "a short, warm plan title",
  "description": "one or two sentences on what this plan covers",
  "days": [
    { "day": 1, "book_id": 43, "chapter_start": 3, "chapter_end": 3 }
  ]
}

Rules:
- Exactly ${days} entries in "days", numbered 1..${days} in order.
- book_id is 1–66 (1=Genesis, 40=Matthew, 43=John, 66=Revelation), standard Protestant canon order.
- chapter_start/chapter_end are valid chapters for that book; chapter_end >= chapter_start. Keep each day to a reasonable reading length (usually 1–4 chapters).
- Choose passages genuinely relevant to the topic. Vary the books where it makes sense.
- Write "title" and "description" in ${lang}. The "days" contain only numbers, no text.`;
}

Deno.serve(async (req) => {
  try {
    return await handleRequest(req);
  } catch (err) {
    console.error('Unhandled error in ai-plan-generate', err);
    return json({ error: 'INTERNAL_ERROR', message: 'Something went wrong' }, 500);
  }
});

async function handleRequest(req) {
  if (req.method !== 'POST') return json({ error: 'METHOD_NOT_ALLOWED' }, 405);

  // 1. Parse + validate body
  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'BAD_REQUEST', message: 'Invalid JSON' }, 400);
  }

  const { topic, days, locale } = body ?? {};
  if (
    typeof topic !== 'string' ||
    !topic.trim() ||
    topic.length > MAX_TOPIC_LENGTH ||
    typeof days !== 'number' ||
    !Number.isInteger(days) ||
    days < MIN_DAYS ||
    days > MAX_DAYS ||
    !LOCALES.includes(locale)
  ) {
    return json({ error: 'BAD_REQUEST', message: 'Missing or invalid fields' }, 400);
  }

  // 2. Verify JWT + Pro tier
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'NOT_AUTHENTICATED' }, 401);

  const userClient = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_ANON_KEY'), {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: 'NOT_AUTHENTICATED' }, 401);

  const { data: profile } = await userClient.from('profiles').select('tier, pro_since').eq('id', user.id).maybeSingle();
  if (profile?.tier !== 'pro') return json({ error: 'NOT_PRO', message: 'This feature requires a Pro subscription' }, 403);

  const adminClient = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
  const cycleKey = currentCycleStart(profile.pro_since);

  // 3a. Per-feature AI-plan quota (10 / cycle)
  const { data: planUsage } = await adminClient
    .from('ai_plan_usage')
    .select('plan_count')
    .eq('user_id', user.id)
    .eq('cycle_start', cycleKey)
    .maybeSingle();

  if ((planUsage?.plan_count ?? 0) >= AI_PLAN_LIMIT) {
    return json(
      {
        error: 'AI_PLAN_LIMIT_REACHED',
        message: 'You have reached your monthly AI plan limit',
        limit: AI_PLAN_LIMIT,
        resetAt: cycleResetAt(cycleKey),
      },
      429
    );
  }

  // 3b. Global dollar cost ceiling (shared backstop with ai-generate)
  const { data: usage } = await adminClient
    .from('ai_usage')
    .select('cost_usd')
    .eq('user_id', user.id)
    .eq('month', cycleKey)
    .maybeSingle();

  if ((usage?.cost_usd ?? 0) >= MONTHLY_COST_CEILING_USD) {
    return json({ error: 'COST_CEILING_REACHED', message: 'Monthly AI usage limit reached', resetAt: cycleResetAt(cycleKey) }, 429);
  }

  // 4. Call Gemini
  const geminiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
  if (!geminiKey) {
    console.error('GOOGLE_GEMINI_API_KEY not set');
    return json({ error: 'INTERNAL_ERROR', message: 'AI provider not configured' }, 500);
  }

  let parsed;
  let inputTokens = null;
  let outputTokens = null;

  // AI observability — see ../_shared/posthog.ts. `prompt_type: 'plan_generate'`
  // separates the plan generator from the scripture-keyed tools in ai-generate, so
  // cost can be attributed per feature. The topic itself is never sent (free-text
  // user input); only the requested day count.
  const posthog = createPostHog();
  const startedAt = Date.now();
  const aiContext = { distinctId: user.id, model: GEMINI_MODEL, promptType: 'plan_generate', locale };

  // Every failure path below is a real generation attempt that may have burned
  // tokens, so each reports rather than vanishing into a console.error.
  const failGeneration = async (error) => {
    captureAiGeneration(posthog, {
      ...aiContext,
      inputTokens,
      outputTokens,
      latencySeconds: (Date.now() - startedAt) / 1000,
      isError: true,
      error,
    });
    await flushPostHog(posthog);
  };

  try {
    const geminiRes = await fetch(`${GEMINI_ENDPOINT}?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt(days, locale) }] },
        contents: [{ role: 'user', parts: [{ text: topic }] }],
        generationConfig: {
          maxOutputTokens: 2400,
          temperature: 0.8,
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      console.error('Gemini error', geminiRes.status, errBody);
      await failGeneration(`HTTP ${geminiRes.status}`);
      return json({ error: 'GEMINI_ERROR', message: 'AI generation failed' }, 503);
    }

    const geminiJson = await geminiRes.json();
    const candidate = geminiJson?.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;
    inputTokens = geminiJson?.usageMetadata?.promptTokenCount ?? null;
    outputTokens = geminiJson?.usageMetadata?.candidatesTokenCount ?? null;

    if (!text) {
      console.error('Unexpected Gemini response shape', JSON.stringify(geminiJson));
      await failGeneration('Empty response');
      return json({ error: 'GEMINI_ERROR', message: 'Empty AI response' }, 503);
    }

    try {
      parsed = JSON.parse(text);
    } catch {
      console.error('Gemini returned non-JSON', text.slice(0, 500));
      await failGeneration('Malformed JSON');
      return json({ error: 'GEMINI_ERROR', message: 'AI returned malformed plan' }, 503);
    }
  } catch (err) {
    console.error('Gemini fetch failed', err);
    await failGeneration(err instanceof Error ? err.message : 'fetch failed');
    return json({ error: 'GEMINI_ERROR', message: 'AI generation failed' }, 503);
  }

  // 5. Validate the structured plan
  const validated = validatePlan(parsed, days);
  if (!validated) {
    await failGeneration('Invalid plan structure');
    return json({ error: 'GEMINI_ERROR', message: 'AI returned an invalid plan' }, 503);
  }

  // Success — the generation happened and is metered, regardless of whether the
  // user later saves the previewed plan (see `ai_plan_generated` in the app).
  captureAiGeneration(posthog, {
    ...aiContext,
    inputTokens,
    outputTokens,
    latencySeconds: (Date.now() - startedAt) / 1000,
  });

  // 6. Charge both counters (generation cost is real even if the user discards the preview)
  const callCost = (inputTokens ?? 0) * GEMINI_INPUT_COST_PER_TOKEN + (outputTokens ?? 0) * GEMINI_OUTPUT_COST_PER_TOKEN;
  const [planUsageResult, costUsageResult] = await Promise.all([
    adminClient.rpc('increment_ai_plan_usage', { p_user_id: user.id, p_cycle_start: cycleKey }),
    adminClient.rpc('increment_ai_usage', { p_user_id: user.id, p_month: cycleKey, p_cost_usd: callCost }),
  ]);
  if (planUsageResult.error) console.error('ai_plan_usage increment failed', planUsageResult.error);
  if (costUsageResult.error) console.error('ai_usage increment failed', costUsageResult.error);

  // 7. Return the validated preview (NOT persisted). Flush first — the isolate is
  // frozen after the response, so buffered events would be dropped silently.
  await flushPostHog(posthog);
  return json({
    title: validated.title,
    description: validated.description,
    days: validated.days,
    totalDays: validated.days.length,
  });
}

// Returns a cleaned { title, description, days } or null if the plan is invalid.
function validatePlan(parsed, expectedDays) {
  if (!parsed || typeof parsed !== 'object') return null;
  const title = typeof parsed.title === 'string' ? parsed.title.trim() : '';
  const description = typeof parsed.description === 'string' ? parsed.description.trim() : '';
  if (!title || !Array.isArray(parsed.days) || parsed.days.length === 0) return null;

  // Tolerate the model returning a slightly-off count, but require it be close and
  // renumber sequentially so `day` is always 1..N contiguous.
  if (Math.abs(parsed.days.length - expectedDays) > 2) return null;

  const days = [];
  for (let i = 0; i < parsed.days.length; i++) {
    const d = parsed.days[i];
    const bookId = Number(d?.book_id);
    const chapterStart = Number(d?.chapter_start);
    const chapterEnd = Number(d?.chapter_end ?? d?.chapter_start);

    if (!Number.isInteger(bookId) || bookId < 1 || bookId > 66) return null;
    const maxChapter = CHAPTER_COUNTS[bookId - 1];
    if (!Number.isInteger(chapterStart) || chapterStart < 1 || chapterStart > maxChapter) return null;
    if (!Number.isInteger(chapterEnd) || chapterEnd < chapterStart || chapterEnd > maxChapter) return null;

    days.push({ day: i + 1, book_id: bookId, chapter_start: chapterStart, chapter_end: chapterEnd });
  }

  return { title: title.slice(0, 200), description: description.slice(0, 500), days };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
