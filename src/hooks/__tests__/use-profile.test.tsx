import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createQueryWrapper } from '@/test-utils/query-wrapper';
import { useIsPro, useProGate, useTier } from '../use-profile';
import { useIsProRevenueCat } from '../use-revenuecat';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase';
import { capture } from '@/lib/posthog';

/**
 * The Pro gate. Under the "free reading, Pro everything-else" model these three
 * hooks decide whether the entire study/AI layer is on, so a false negative locks
 * out a paying customer and a false positive gives the product away.
 *
 * `useIsProRevenueCat` is mocked rather than driven through the SDK: the OR
 * semantics between the two sources are what's under test here, and the SDK-side
 * predicate has its own coverage in `src/lib/__tests__/revenuecat.test.ts`.
 */

jest.mock('../use-revenuecat', () => ({
  useIsProRevenueCat: jest.fn(() => false),
}));

const mockedIsProRevenueCat = useIsProRevenueCat as jest.MockedFunction<typeof useIsProRevenueCat>;
const mockedPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockedPush }),
}));

/** Point the mocked Supabase client at a `profiles` row (or an absent one). */
function mockProfileRow(row: { tier: 'free' | 'pro' } | null, error: unknown = null) {
  (supabase.from as jest.Mock).mockReturnValue({
    select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: row, error }) }) }),
  });
}

/**
 * Auth state is seeded BEFORE each `renderHook`, never mid-render, so a plain
 * `setState` is correct here — there is no mounted subscriber to update, and
 * wrapping these in `act()` would instead tie them to a render pass that hasn't
 * happened yet (which detaches `result.current`).
 */
function signIn() {
  useAuthStore.setState({
    user: { id: 'user-1', email: 'edu@example.com', firstName: 'E', lastName: 'A' },
    isAuthenticated: true,
  });
}

function signOut() {
  useAuthStore.setState({ user: null, isAuthenticated: false });
}

beforeEach(() => {
  signOut();
  mockedIsProRevenueCat.mockReturnValue(false);
  mockedPush.mockClear();
  (capture as jest.Mock).mockClear();
});

describe('useTier', () => {
  it('returns the server tier for a signed-in user', async () => {
    signIn();
    mockProfileRow({ tier: 'pro' });

    const { result } = await renderHook(() => useTier(), createQueryWrapper());

    await waitFor(() => expect(result.current).toBe('pro'));
  });

  it('defaults to free for a guest (query disabled, never fetches)', async () => {
    mockProfileRow({ tier: 'pro' });

    const { result } = await renderHook(() => useTier(), createQueryWrapper());

    expect(result.current).toBe('free');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('degrades to free when the profile row is missing', async () => {
    // Real case: a __DEV__ mock-login user has no Supabase row. The gate must
    // not hard-fail — it just means no Pro.
    signIn();
    mockProfileRow(null);

    const { result } = await renderHook(() => useTier(), createQueryWrapper());

    await waitFor(() => expect(result.current).toBe('free'));
  });

  it('stays free while the query is still loading', async () => {
    signIn();
    (supabase.from as jest.Mock).mockReturnValue({
      select: () => ({ eq: () => ({ maybeSingle: () => new Promise(() => {}) }) }),
    });

    const { result } = await renderHook(() => useTier(), createQueryWrapper());

    expect(result.current).toBe('free');
  });
});

describe('useIsPro', () => {
  it('is false for a free user with no RevenueCat entitlement', async () => {
    signIn();
    mockProfileRow({ tier: 'free' });

    const { result } = await renderHook(() => useIsPro(), createQueryWrapper());

    await waitFor(() => expect(result.current).toBe(false));
  });

  it('is true when profiles.tier is pro (server-authoritative backstop)', async () => {
    signIn();
    mockProfileRow({ tier: 'pro' });

    const { result } = await renderHook(() => useIsPro(), createQueryWrapper());

    await waitFor(() => expect(result.current).toBe(true));
  });

  it('is true from RevenueCat alone, before the webhook has flipped the tier', async () => {
    // This is the whole point of the OR: a just-completed purchase unlocks
    // instantly rather than waiting on the webhook → profiles.tier round-trip.
    signIn();
    mockProfileRow({ tier: 'free' });
    mockedIsProRevenueCat.mockReturnValue(true);

    const { result } = await renderHook(() => useIsPro(), createQueryWrapper());

    expect(result.current).toBe(true);
  });

  it('is true from RevenueCat even when the profile query fails', async () => {
    // Offline/degraded backend must not revoke Pro from someone who has it.
    signIn();
    mockProfileRow(null, new Error('network'));
    mockedIsProRevenueCat.mockReturnValue(true);

    const { result } = await renderHook(() => useIsPro(), createQueryWrapper());

    expect(result.current).toBe(true);
  });

  it('is false for a guest even if RevenueCat reports an entitlement', async () => {
    // A guest can hold an anonymous RevenueCat entitlement on a shared device.
    // `useTier` is guest-disabled, so this documents that the RevenueCat arm is
    // what decides here — see the sign-out identity reset in stores/auth.ts,
    // which is what actually prevents the leak.
    mockedIsProRevenueCat.mockReturnValue(false);

    const { result } = await renderHook(() => useIsPro(), createQueryWrapper());

    expect(result.current).toBe(false);
  });
});

describe('useProGate', () => {
  it('routes a signed-in user to the paywall', async () => {
    signIn();

    const { result } = await renderHook(() => useProGate(), createQueryWrapper());
    result.current.openPro('study_tab');

    expect(mockedPush).toHaveBeenCalledWith('/paywall');
  });

  it('routes a GUEST to register, never the paywall', async () => {
    // An account is a hard precondition for Pro: a guest purchase binds to an
    // anonymous RevenueCat id that's lost on reinstall — the user pays and
    // silently loses access. This is the assertion that prevents that.
    const { result } = await renderHook(() => useProGate(), createQueryWrapper());
    result.current.openPro('study_tab');

    expect(mockedPush).toHaveBeenCalledWith('/register');
    expect(mockedPush).not.toHaveBeenCalledWith('/paywall');
  });

  it('reports requiresAccount so callers can disclose it up front', async () => {
    const guest = await renderHook(() => useProGate(), createQueryWrapper());
    expect(guest.result.current.requiresAccount).toBe(true);

    // Signing in here happens while `guest` is mounted and subscribed, so this
    // store write DOES need `act` — unlike the pre-render seeding above.
    await act(async () => signIn());

    expect(guest.result.current.requiresAccount).toBe(false);
  });

  it('captures pro_gate_hit with the source — the whole upsell funnel', async () => {
    // Every Pro-gated surface routes through openPro, so this one event is the
    // complete attribution. New gates that push /paywall directly are invisible.
    signIn();

    const { result } = await renderHook(() => useProGate(), createQueryWrapper());
    result.current.openPro('translation_picker');

    expect(capture).toHaveBeenCalledWith('pro_gate_hit', {
      source: 'translation_picker',
      requires_account: false,
    });
  });

  it('marks the capture requires_account for a guest', async () => {
    const { result } = await renderHook(() => useProGate(), createQueryWrapper());
    result.current.openPro('plans_tab');

    expect(capture).toHaveBeenCalledWith('pro_gate_hit', {
      source: 'plans_tab',
      requires_account: true,
    });
  });
});
