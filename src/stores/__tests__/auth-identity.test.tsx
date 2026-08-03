import { identifyRevenueCat, resetRevenueCat } from '@/lib/revenuecat';
import { identifyUser, resetIdentity } from '@/lib/posthog';

/**
 * `syncRevenueCatIdentity` / `syncPostHogIdentity` — the two identity seams in
 * `src/stores/auth.ts`.
 *
 * Their synchronous `last*UserId` guard is the whole point: `onAuthStateChange`
 * re-fires on every token refresh with the same user, and RevenueCat's
 * `Purchases.logOut()` **throws** ("the current user is anonymous") if it runs
 * twice for one sign-out. An async `isAnonymous()` pre-check cannot fix that —
 * the check and the call aren't atomic (RevenueCat/purchases-flutter#934) — so
 * these tests pin the dedupe behaviour that does.
 *
 * Module state (`lastRevenueCatUserId`) persists across tests, so each test uses
 * `jest.isolateModules` to get a fresh copy rather than leaking guard state.
 */

jest.mock('@/lib/revenuecat', () => ({
  identifyRevenueCat: jest.fn().mockResolvedValue(undefined),
  resetRevenueCat: jest.fn().mockResolvedValue(undefined),
}));

type AuthModule = typeof import('../auth');

/**
 * Load a pristine copy of the auth store module (resets the identity guards).
 * `require` is required here, not a style choice: `jest.isolateModules` needs a
 * synchronous re-import inside its callback to hand back a fresh registry entry,
 * which a static `import` (hoisted, evaluated once) cannot provide.
 */
function freshAuthModule(): AuthModule {
  let mod!: AuthModule;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('../auth');
  });
  return mod;
}

describe('syncRevenueCatIdentity', () => {
  it('identifies on first call for a user', () => {
    freshAuthModule().syncRevenueCatIdentity('user-1');

    expect(identifyRevenueCat).toHaveBeenCalledWith('user-1');
  });

  it('does NOT re-identify on repeated calls with the same user', () => {
    // A token refresh re-fires onAuthStateChange with the same user; without the
    // guard this would issue a redundant logIn per refresh.
    const { syncRevenueCatIdentity } = freshAuthModule();

    syncRevenueCatIdentity('user-1');
    syncRevenueCatIdentity('user-1');
    syncRevenueCatIdentity('user-1');

    expect(identifyRevenueCat).toHaveBeenCalledTimes(1);
  });

  it('re-identifies when the user actually changes (account switch)', () => {
    const { syncRevenueCatIdentity } = freshAuthModule();

    syncRevenueCatIdentity('user-1');
    syncRevenueCatIdentity('user-2');

    expect(identifyRevenueCat).toHaveBeenNthCalledWith(1, 'user-1');
    expect(identifyRevenueCat).toHaveBeenNthCalledWith(2, 'user-2');
  });

  it('resets exactly ONCE on sign-out, even when called repeatedly', () => {
    // The critical case: `useLogout` and the auth listener can both fire for one
    // sign-out. A second `Purchases.logOut()` throws, so this must dedupe.
    const { syncRevenueCatIdentity } = freshAuthModule();

    syncRevenueCatIdentity('user-1');
    syncRevenueCatIdentity(null);
    syncRevenueCatIdentity(null);

    expect(resetRevenueCat).toHaveBeenCalledTimes(1);
  });

  it('does not reset when no user was ever identified', () => {
    // A guest launch: the listener fires with a null session. Calling logOut on
    // an already-anonymous user is exactly the throwing case.
    freshAuthModule().syncRevenueCatIdentity(null);

    expect(resetRevenueCat).not.toHaveBeenCalled();
  });

  it('identifies again after a sign-out / sign-in cycle', () => {
    const { syncRevenueCatIdentity } = freshAuthModule();

    syncRevenueCatIdentity('user-1');
    syncRevenueCatIdentity(null);
    syncRevenueCatIdentity('user-1');

    expect(identifyRevenueCat).toHaveBeenCalledTimes(2);
  });

  it('swallows SDK failures so they never block auth state updates', async () => {
    (identifyRevenueCat as jest.Mock).mockRejectedValueOnce(new Error('network'));

    expect(() => freshAuthModule().syncRevenueCatIdentity('user-1')).not.toThrow();
    await Promise.resolve(); // let the rejected promise settle unhandled-free
  });
});

describe('syncPostHogIdentity', () => {
  it('identifies on first call and dedupes repeats', () => {
    const { syncPostHogIdentity } = freshAuthModule();

    syncPostHogIdentity('user-1');
    syncPostHogIdentity('user-1');

    expect(identifyUser).toHaveBeenCalledTimes(1);
    expect(identifyUser).toHaveBeenCalledWith('user-1');
  });

  it('resets identity once on sign-out', () => {
    const { syncPostHogIdentity } = freshAuthModule();

    syncPostHogIdentity('user-1');
    syncPostHogIdentity(null);
    syncPostHogIdentity(null);

    expect(resetIdentity).toHaveBeenCalledTimes(1);
  });

  it('uses its own guard, independent of the RevenueCat one', () => {
    // Two separate module-level guards; driving one must not suppress the other.
    const { syncRevenueCatIdentity, syncPostHogIdentity } = freshAuthModule();

    syncRevenueCatIdentity('user-1');
    syncPostHogIdentity('user-1');

    expect(identifyRevenueCat).toHaveBeenCalledTimes(1);
    expect(identifyUser).toHaveBeenCalledTimes(1);
  });

  it('sends the same distinct id to both, so revenue and product events join', () => {
    // The Supabase auth.users.id is deliberately the id for PostHog, RevenueCat's
    // app_user_id, and the Edge Functions' $ai_generation — one person, one id.
    const { syncRevenueCatIdentity, syncPostHogIdentity } = freshAuthModule();

    syncRevenueCatIdentity('user-1');
    syncPostHogIdentity('user-1');

    expect(identifyRevenueCat).toHaveBeenCalledWith('user-1');
    expect(identifyUser).toHaveBeenCalledWith('user-1');
  });
});
