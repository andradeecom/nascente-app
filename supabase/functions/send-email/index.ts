// @ts-nocheck — Deno edge function; type-checked by Deno at deploy, not the app's tsserver.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import * as React from 'npm:react@19.2.8';
import { render } from 'npm:@react-email/render@2.1.0';
import { Resend } from 'npm:resend@6.18.1';
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';
import { AuthEmail } from './AuthEmail.tsx';
import { COPY, CODE_ACTION_TYPES, SUPPORTED_ACTION_TYPES, resolveLocale } from './copy.ts';

/**
 * Send Email Auth Hook — branded, per-locale auth emails via Resend.
 *
 * Replaces Supabase's dashboard email templates, which store exactly ONE HTML body
 * per email type and therefore cannot send pt/es/en variants of the same email.
 * See `.docs/email-delivery.md` for the full rationale.
 *
 * Flow:
 *   1. Verify the Standard Webhooks signature (this is the auth gate — see below)
 *   2. Resolve the recipient's locale from `user_metadata.locale`
 *   3. Build the confirmation URL from `token_hash` + `redirect_to`
 *   4. Render the React Email template to HTML
 *   5. Send via the Resend API
 *
 * IMPORTANT — deploy with JWT verification OFF (`--no-verify-jwt`). Supabase's auth
 * server calls this hook with a Standard Webhooks signature, NOT a Supabase JWT, so
 * leaving verify_jwt on rejects every call. Step 1 is what authenticates the caller;
 * without a valid signature nothing is sent.
 *
 * Failure semantics: returning non-2xx makes Supabase surface an error to the user
 * and NOT fall back to its own mailer — a bug here blocks signups/resets entirely.
 * So unknown/unhandled action types are ack'd with 200 rather than erroring.
 *
 * Secrets (`supabase secrets set`, never in the repo):
 *   - SEND_EMAIL_HOOK_SECRET   from Dashboard → Auth → Hooks (format: `v1,whsec_<base64>`)
 *   - RESEND_API_KEY           Resend API key (re_...)
 *   - AUTH_EMAIL_FROM          e.g. "Nascente <noreply@nascente.app>"
 *   - SUPABASE_URL             (auto-injected) — base for the /auth/v1/verify link
 */

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

/**
 * Supabase hands us a `token_hash`, not a finished link — the clickable URL is
 * assembled here. Hitting /auth/v1/verify consumes the token and then bounces the
 * user to `redirect_to`, which for this app is a `nascenteapp://` deep link.
 */
function buildConfirmationUrl(emailData) {
  const params = new URLSearchParams({
    token: emailData.token_hash,
    type: emailData.email_action_type,
  });
  if (emailData.redirect_to) params.set('redirect_to', emailData.redirect_to);

  return `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?${params.toString()}`;
}

/**
 * Pull `?locale=` off the redirect target the client asked for.
 *
 * Parsed off the raw query string rather than via `new URL()`: these are custom-
 * scheme deep links (`nascenteapp://reset-password?locale=es`), and URL parsing of
 * non-special schemes is inconsistent about what lands in `search`. A plain regex
 * over the substring after `?` has no such edge cases.
 *
 * The value is untrusted (it comes from the client), which is fine — `resolveLocale`
 * only ever maps it onto a known locale or the pt fallback, so a junk value can't
 * do anything worse than pick the default language.
 */
function localeFromRedirect(redirectTo) {
  if (!redirectTo || typeof redirectTo !== 'string') return null;
  const query = redirectTo.split('?')[1];
  if (!query) return null;
  const match = query.match(/(?:^|&)locale=([^&#]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET');
  const fromAddress = Deno.env.get('AUTH_EMAIL_FROM');

  if (!hookSecret || !fromAddress || !Deno.env.get('RESEND_API_KEY')) {
    console.error('send-email misconfigured: missing SEND_EMAIL_HOOK_SECRET, RESEND_API_KEY or AUTH_EMAIL_FROM');
    return jsonResponse(500, { error: { http_code: 500, message: 'Email service not configured' } });
  }

  // 1. Verify the Standard Webhooks signature over the RAW body. Must read the body
  // as text (not .json()) — the signature covers the exact bytes sent.
  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);

  let user;
  let email_data;
  try {
    const webhook = new Webhook(hookSecret.replace('v1,whsec_', ''));
    ({ user, email_data } = webhook.verify(payload, headers));
  } catch (error) {
    console.error('webhook signature verification failed', error);
    return jsonResponse(401, { error: { http_code: 401, message: 'Invalid signature' } });
  }

  const actionType = email_data?.email_action_type;

  // Notification-only action types (password_changed_notification, MFA/identity
  // events, …) aren't emails this project sends. Ack so Supabase doesn't treat it
  // as a failure and block the underlying auth operation.
  if (!SUPPORTED_ACTION_TYPES.includes(actionType)) {
    console.log('send-email: ignoring unhandled action type', actionType);
    return jsonResponse(200, {});
  }

  // 2. Locale, in priority order:
  //    a) `?locale=` on redirect_to — set by the CLIENT at request time, so it
  //       reflects the device's language RIGHT NOW. This is the only signal that
  //       works for signed-out flows (forgot-password): there's no session to have
  //       synced `user_metadata` with, so a guest — or anyone who switched language
  //       after signing up — would otherwise get their signup-time language.
  //    b) `user_metadata.locale` — stamped at signup, refreshed on language change
  //       while signed in (src/stores/locale.ts). Covers flows where the client
  //       didn't set a redirect (e.g. an email change triggered server-side).
  //    c) pt fallback, via resolveLocale.
  const locale = resolveLocale(localeFromRedirect(email_data?.redirect_to) ?? user?.user_metadata?.locale);
  const localeCopy = COPY[locale];
  const copy = localeCopy[actionType];

  // 3–4. Build the link and render the branded template.
  const isCode = CODE_ACTION_TYPES.includes(actionType);
  const confirmationUrl = isCode ? null : buildConfirmationUrl(email_data);

  // `{{email}}` is only used by the email-change templates, where the address being
  // confirmed is the NEW one (`new_email`), not the current `user.email`.
  const targetEmail = user?.new_email ?? email_data?.new_email ?? user?.email ?? '';
  const body = copy.body.map((line) => line.replace('{{email}}', targetEmail));

  let html;
  try {
    html = await render(
      React.createElement(AuthEmail, {
        heading: copy.heading,
        body,
        actionLabel: copy.action,
        actionUrl: confirmationUrl,
        token: isCode ? email_data.token : null,
        common: localeCopy.common,
      })
    );
  } catch (error) {
    console.error('template render failed', { actionType, locale, error });
    return jsonResponse(500, { error: { http_code: 500, message: 'Failed to render email' } });
  }

  // 5. Send. `email_change` fires twice (old + new address); Supabase sets
  // `email_data.email_action_type` accordingly, and the recipient for the
  // *_new variant is the new address.
  const recipient = actionType === 'email_change_new' ? targetEmail : (user?.email ?? targetEmail);

  const { error } = await resend.emails.send({
    from: fromAddress,
    to: [recipient],
    subject: copy.subject,
    html,
  });

  if (error) {
    console.error('resend send failed', { actionType, locale, error });
    return jsonResponse(500, { error: { http_code: 500, message: 'Failed to send email' } });
  }

  // Supabase expects an empty JSON object on success.
  return jsonResponse(200, {});
});
