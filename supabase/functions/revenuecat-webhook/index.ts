// @ts-nocheck — Deno edge function; type-checked by Deno at deploy, not the app's tsserver.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * RevenueCat webhook → server-authoritative `profiles.tier` grant.
 *
 * This is the ONLY client-side-reachable writer of `profiles.tier` (besides the
 * signup trigger that seeds 'free'). The app never writes tier directly — it's
 * billing-controlled — so Pro is granted/revoked here, off a verified RevenueCat
 * webhook, using the service-role key (bypasses RLS).
 *
 * Auth: RevenueCat sends a static `Authorization` header you configure on the
 * dashboard; we compare it against REVENUECAT_WEBHOOK_SECRET. (verify_jwt is OFF
 * for this function — RevenueCat can't send a Supabase JWT — so this header check
 * is the gate.)
 *
 * Identity: `event.app_user_id` is the id we set via `Purchases.logIn(user.id)`
 * (see src/stores/auth.ts), i.e. the `auth.users` / `profiles` id.
 *
 * Secrets (set with `supabase secrets set`, never in the repo):
 *   - REVENUECAT_WEBHOOK_SECRET   shared header value
 *   - SUPABASE_URL                (auto-injected)
 *   - SUPABASE_SERVICE_ROLE_KEY   (auto-injected)
 */

// Event types that mean the user currently has Pro.
const GRANT_EVENTS = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE', 'UNCANCELLATION', 'NON_RENEWING_PURCHASE']);
// Event types that mean Pro has ended (access lost). CANCELLATION is intentionally
// NOT here — a cancellation only stops auto-renew; access lasts until EXPIRATION.
const REVOKE_EVENTS = new Set(['EXPIRATION', 'SUBSCRIPTION_PAUSED']);

const PRO_ENTITLEMENT = 'pro';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // 1. Verify the shared secret.
  const expected = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
  const provided = req.headers.get('Authorization');
  if (!expected || provided !== expected) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 2. Parse the event.
  let body: { event?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return new Response('Bad request', { status: 400 });
  }
  const event = body.event ?? {};
  const type = String(event.type ?? '');
  const appUserId = event.app_user_id as string | undefined;
  const entitlementIds = (event.entitlement_ids as string[] | null) ?? [];

  if (!appUserId) {
    return new Response('Missing app_user_id', { status: 400 });
  }

  // RevenueCat anonymous ids look like `$RCAnonymousID:...` — those aren't a
  // Supabase user, so there's nothing to grant. Ack so RevenueCat stops retrying.
  if (appUserId.startsWith('$RCAnonymousID:')) {
    return new Response(JSON.stringify({ ok: true, skipped: 'anonymous' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 3. Resolve the target tier from the event.
  const touchesPro = entitlementIds.length === 0 || entitlementIds.includes(PRO_ENTITLEMENT);
  let nextTier: 'free' | 'pro' | null = null;
  if (GRANT_EVENTS.has(type) && touchesPro) nextTier = 'pro';
  else if (REVOKE_EVENTS.has(type) && touchesPro) nextTier = 'free';

  // Events we don't act on (e.g. TEST, CANCELLATION, BILLING_ISSUE, TRANSFER) — ack.
  if (nextTier === null) {
    return new Response(JSON.stringify({ ok: true, ignored: type }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 4. Apply with the service-role client (bypasses RLS; idempotent update).
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // pro_since anchors the AI cost-ceiling's rolling cycle (see ai-generate) to the
  // start of the user's *current continuous* Pro period — not the calendar month.
  // Only stamp it on a fresh grant (row is currently 'free'); a RENEWAL of an
  // already-Pro row must NOT reset it, or every renewal would restart the cycle.
  // Cleared on revoke so the next grant starts a new period.
  let update: { tier: 'free' | 'pro'; pro_since?: string | null } = { tier: nextTier };

  if (nextTier === 'pro') {
    const { data: current } = await admin.from('profiles').select('tier').eq('id', appUserId).maybeSingle();
    if (current?.tier !== 'pro') {
      const purchasedAtMs = event.purchased_at_ms as number | undefined;
      update.pro_since = purchasedAtMs ? new Date(purchasedAtMs).toISOString() : new Date().toISOString();
    }
  } else {
    update.pro_since = null;
  }

  const { error } = await admin.from('profiles').update(update).eq('id', appUserId);

  if (error) {
    console.error('profiles tier update failed', { appUserId, nextTier, error });
    return new Response('Update failed', { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, appUserId, tier: nextTier }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
