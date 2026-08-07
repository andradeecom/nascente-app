import { supabase } from '@/lib/supabase';

/**
 * Permanently deletes the signed-in user's account via the `delete-account`
 * Edge Function (the auth user can only be removed with the service role, which
 * never reaches the client). `functions.invoke` attaches the current session's
 * JWT automatically, and the function derives the user id from that verified
 * token — there is deliberately no id in the request body.
 */
export async function callDeleteAccount(): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-account', { body: {} });

  if (error) {
    // Supabase wraps non-2xx as a FunctionsHttpError whose `context` holds the body.
    const raw = (error as unknown as { context?: { json?: () => Promise<{ message?: string }> } }).context;
    if (raw?.json) {
      try {
        const body = await raw.json();
        if (body?.message) throw new Error(body.message);
      } catch (inner) {
        if (inner instanceof Error && inner.message) throw inner;
      }
    }
    throw new Error(error.message);
  }
}
