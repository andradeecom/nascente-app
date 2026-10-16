// @ts-nocheck — Deno edge function; type-checked by Deno at deploy, not the app's tsserver.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * Account deletion — self-service, permanent.
 *
 * Required by App Store Review Guideline 5.1.1(v): an app that supports account
 * creation must also let the user initiate account deletion from within the app.
 *
 * Flow:
 *   1. Verify JWT via userClient.auth.getUser() — the caller can ONLY ever delete
 *      themselves; the id comes from the verified token, never from the request body.
 *   2. Remove the user's avatar objects from the `avatars` storage bucket.
 *   3. Delete the auth user with the service role.
 *
 * Everything in Postgres is removed by step 3 alone: every user-scoped table
 * (profiles, highlights, notes, bookmarks, user_reading_progress,
 * user_reading_plans, user_reading_plan_completions, ai_usage, ai_plan_usage,
 * and AI plans via reading_plans.owner_id) declares
 * `references auth.users (id) on delete cascade`, so removing the auth row
 * cascades them all. See .docs/data-model.md.
 *
 * Storage is the one exception — `storage.objects` rows are NOT cascaded from
 * auth.users, so the avatar folder is deleted explicitly in step 2. It runs
 * BEFORE the auth delete: afterwards we'd still know the uid, but a failure
 * would leave an orphaned object with no account left to retry from. A storage
 * failure here is logged and swallowed rather than aborting — a stray avatar
 * blob is far better than a user who cannot delete their account. (For the same
 * reason, deletion here does not assume the per-upload cleanup in
 * `lib/avatar-storage.ts` always succeeded — it sweeps the whole folder.)
 *
 * Deploy:
 *   supabase functions deploy delete-account
 *
 * Secrets (auto-injected by the platform):
 *   - SUPABASE_URL
 *   - SUPABASE_ANON_KEY
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

const AVATAR_BUCKET = 'avatars';
const AVATAR_LIST_LIMIT = 100; // a user holds ~1 avatar; the headroom only catches strays

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'METHOD_NOT_ALLOWED' }, 405);
  }

  // 1. Verify JWT. The user id is taken from the verified token only — there is
  // deliberately no id/email field in the request body, so this endpoint cannot
  // be pointed at another account no matter what the caller sends.
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

  const adminClient = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

  // 2. Best-effort storage cleanup — `storage.objects` rows are NOT cascaded by
  // the auth delete below, so the user's avatar folder is removed explicitly.
  //
  // A user holds at most one avatar (`uploadAvatar` deletes the previous object
  // after storing a new one — see lib/avatar-storage.ts), so a single `list()`
  // page is enough. The generous limit is pure belt-and-braces: it also sweeps up
  // any strays left by an upload whose cleanup step failed, since that cleanup is
  // itself best-effort.
  try {
    const { data: objects } = await adminClient.storage
      .from(AVATAR_BUCKET)
      .list(user.id, { limit: AVATAR_LIST_LIMIT });
    if (objects?.length) {
      await adminClient.storage.from(AVATAR_BUCKET).remove(objects.map((object) => `${user.id}/${object.name}`));
    }
  } catch (error) {
    console.error('[delete-account] avatar cleanup failed', error);
  }

  // 3. Delete the auth user — cascades every user-scoped Postgres row.
  // The second arg is `shouldSoftDelete` and defaults to false; passing it
  // explicitly documents that this is a HARD delete. A soft delete would only
  // set `deleted_at` and keep the row, which would not satisfy the App Store
  // requirement that the user's data actually be removed.
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id, false);
  if (deleteError) {
    console.error('[delete-account] auth delete failed', deleteError);
    return json({ error: 'DELETE_FAILED', message: deleteError.message }, 500);
  }

  return json({ success: true });
});

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
