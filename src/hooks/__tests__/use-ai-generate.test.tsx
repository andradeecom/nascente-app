import { renderHook, waitFor } from '@testing-library/react-native';
import { createQueryWrapper } from '@/test-utils/query-wrapper';
import { useAiGenerate } from '../use-ai-generate';
import { callAiGenerate } from '@/services/ai';
import { useAiCacheStore } from '@/stores/ai-cache';
import { AiGenerateError, aiCacheKey, type AiGenerateRequest } from '@/types/ai';
import { capture } from '@/lib/posthog';

/**
 * `useAiGenerate` is where AI cost is decided and measured. Two things are load-
 * bearing and neither is visible at a call site:
 *
 * 1. A local cache hit must short-circuit before `callAiGenerate`, or every
 *    re-open of a passage bills Gemini and burns the user's metered quota.
 * 2. The analytics contract: which events fire, and what `from_cache` means.
 *
 * ⚠️ On (2) these tests document behaviour that DIFFERS from the source's own
 * comment block. `use-ai-generate.ts` states that the queryFn still runs on a
 * locally-cached passage and so captures cache-hit events; it does not — a warm
 * key is resolved synchronously by `initialData` and fires nothing at all. See
 * the "fires NO event on a warm local cache" test for the sequences checked.
 */

jest.mock('@/services/ai', () => ({ callAiGenerate: jest.fn() }));

const mockedCall = callAiGenerate as jest.MockedFunction<typeof callAiGenerate>;
const mockedCapture = capture as jest.MockedFunction<typeof capture>;

const params: AiGenerateRequest & { enabled: boolean } = {
  translationId: 'bibliaLivre',
  bookId: 43,
  chapter: 3,
  verseStart: 16,
  verseEnd: 16,
  promptType: 'explain',
  passageText: 'Porque Deus amou o mundo…',
  locale: 'pt',
  reference: 'João 3:16',
  enabled: true,
};

const KEY = aiCacheKey('bibliaLivre', 43, 3, 16, 16, 'explain', 'pt');

/** Events of one name, with their properties. */
function capturedEvents(name: string) {
  return mockedCapture.mock.calls.filter(([event]) => event === name).map(([, props]) => props);
}

beforeEach(() => {
  useAiCacheStore.setState({ byKey: {} });
  mockedCapture.mockClear();
  mockedCall.mockReset();
});

describe('useAiGenerate — cache behaviour', () => {
  it('calls the Edge Function on a cache miss and stores the result', async () => {
    mockedCall.mockResolvedValue({ content: 'an explanation', fromCache: false });

    const { result } = await renderHook(() => useAiGenerate(params), createQueryWrapper());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedCall).toHaveBeenCalledTimes(1);
    expect(useAiCacheStore.getState().byKey[KEY]).toMatchObject({ content: 'an explanation' });
  });

  it('serves a local cache hit WITHOUT calling the Edge Function', async () => {
    // The cost guarantee: a cached passage must never reach Gemini again.
    useAiCacheStore.setState({
      byKey: { [KEY]: { content: 'cached explanation', fetchedAt: '2026-01-01T00:00:00.000Z' } },
    });

    const { result } = await renderHook(() => useAiGenerate(params), createQueryWrapper());

    await waitFor(() => expect(result.current.data?.content).toBe('cached explanation'));
    expect(mockedCall).not.toHaveBeenCalled();
  });

  it('marks a locally-cached result as fromCache', async () => {
    useAiCacheStore.setState({
      byKey: { [KEY]: { content: 'cached', fetchedAt: '2026-01-01T00:00:00.000Z' } },
    });

    const { result } = await renderHook(() => useAiGenerate(params), createQueryWrapper());

    await waitFor(() => expect(result.current.data?.fromCache).toBe(true));
  });

  it('does not fetch at all while disabled (sheets mount closed)', async () => {
    mockedCall.mockResolvedValue({ content: 'x', fromCache: false });

    await renderHook(() => useAiGenerate({ ...params, enabled: false }), createQueryWrapper());

    expect(mockedCall).not.toHaveBeenCalled();
    expect(capturedEvents('ai_generate_requested')).toHaveLength(0);
  });

  it('keys the cache by prompt type, so two tools on one passage do not collide', async () => {
    // Explain and devotional share the passage but must not serve each other.
    useAiCacheStore.setState({
      byKey: { [KEY]: { content: 'the explanation', fetchedAt: '2026-01-01T00:00:00.000Z' } },
    });
    mockedCall.mockResolvedValue({ content: 'the devotional', fromCache: false });

    const { result } = await renderHook(
      () => useAiGenerate({ ...params, promptType: 'devotional' }),
      createQueryWrapper()
    );

    await waitFor(() => expect(result.current.data?.content).toBe('the devotional'));
    expect(mockedCall).toHaveBeenCalledTimes(1);
  });
});

describe('useAiGenerate — analytics contract', () => {
  it('captures exactly one requested event per open, on a miss', async () => {
    mockedCall.mockResolvedValue({ content: 'x', fromCache: false });

    const { result } = await renderHook(() => useAiGenerate(params), createQueryWrapper());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedEvents('ai_generate_requested')).toEqual([{ prompt_type: 'explain' }]);
  });

  it('fires no ai_generate_* event on a warm local cache — those count misses, not opens', async () => {
    // `initialData` is recomputed from the store on every render, so as soon as the
    // key is warm the query resolves synchronously under `staleTime: Infinity` and
    // the queryFn never runs — verified across all three sequences: mounted
    // already-enabled, `enabled` flipped false→true, and the reader's real "key
    // changes when the sheet opens" flow (verse null→16), including with a fresh
    // QueryClient standing in for a new screen mount.
    //
    // This is now INTENTIONAL and documented rather than a defect: `ai_generate_*`
    // means "a billed generation", lining up 1:1 with spend, and `from_cache: true`
    // on `ai_generate_succeeded` can only ever mean a SERVER-cache hit. Engagement
    // ("how often is Explain opened?") is answered by `ai_tool_opened` instead —
    // see the tests below. Do NOT move the ai_generate_* captures into an effect to
    // "restore" hit coverage; that reintroduces double-counting on the miss path.
    useAiCacheStore.setState({
      byKey: { [KEY]: { content: 'cached', fetchedAt: '2026-01-01T00:00:00.000Z' } },
    });

    const { result } = await renderHook(() => useAiGenerate(params), createQueryWrapper());
    await waitFor(() => expect(result.current.data?.content).toBe('cached'));

    expect(capturedEvents('ai_generate_requested')).toHaveLength(0);
    expect(capturedEvents('ai_generate_succeeded')).toHaveLength(0);
  });

  it('fires no event on a warm reopen either, even as a brand-new query client', async () => {
    // The "new sheet mount" variant of the case above: generate once (events
    // fire), then re-open against the now-warm cache with a fresh QueryClient.
    // Still silent — confirming the short-circuit isn't an artifact of a reused
    // React Query cache.
    mockedCall.mockResolvedValue({ content: 'fresh', fromCache: false });

    const first = await renderHook(() => useAiGenerate(params), createQueryWrapper());
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    expect(capturedEvents('ai_generate_requested')).toHaveLength(1); // the miss WAS captured

    mockedCapture.mockClear();

    const second = await renderHook(() => useAiGenerate(params), createQueryWrapper());
    await waitFor(() => expect(second.result.current.data?.content).toBe('fresh'));

    expect(capturedEvents('ai_generate_requested')).toHaveLength(0);
    expect(mockedCall).toHaveBeenCalledTimes(1); // and it stayed free
  });

  it('fires ai_tool_opened on a warm local cache — the engagement metric', async () => {
    // The gap the ai_generate_* events leave: a reopened passage is free and silent
    // there, but it IS usage, and the local cache is persisted with no expiry — so
    // without this a passage opened once would be invisible forever after.
    useAiCacheStore.setState({
      byKey: { [KEY]: { content: 'cached', fetchedAt: '2026-01-01T00:00:00.000Z' } },
    });

    const { result } = await renderHook(() => useAiGenerate(params), createQueryWrapper());
    await waitFor(() => expect(result.current.data?.content).toBe('cached'));

    expect(capturedEvents('ai_tool_opened')).toEqual([{ prompt_type: 'explain', from_cache: true }]);
  });

  it('fires ai_tool_opened EXACTLY once on a miss — the cache write must not double-count', async () => {
    // The regression this guards: the miss path writes to the AI cache store, which
    // flips this key from cold → warm mid-flight. If the effect depended on that
    // state it would refire and report two opens for one tap. Reading it through a
    // ref is what keeps this at one.
    mockedCall.mockResolvedValue({ content: 'fresh', fromCache: false });

    const { result } = await renderHook(() => useAiGenerate(params), createQueryWrapper());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedEvents('ai_tool_opened')).toEqual([{ prompt_type: 'explain', from_cache: false }]);
  });

  it('does not fire ai_tool_opened while the sheet is closed', async () => {
    useAiCacheStore.setState({
      byKey: { [KEY]: { content: 'cached', fetchedAt: '2026-01-01T00:00:00.000Z' } },
    });

    await renderHook(() => useAiGenerate({ ...params, enabled: false }), createQueryWrapper());

    expect(capturedEvents('ai_tool_opened')).toHaveLength(0);
  });

  it('counts a reopen as a second ai_tool_opened, unlike ai_generate_*', async () => {
    // Two opens of the same passage: one billed generation, two engagements.
    mockedCall.mockResolvedValue({ content: 'fresh', fromCache: false });

    const first = await renderHook(() => useAiGenerate(params), createQueryWrapper());
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));

    const second = await renderHook(() => useAiGenerate(params), createQueryWrapper());
    await waitFor(() => expect(second.result.current.data?.content).toBe('fresh'));

    expect(capturedEvents('ai_tool_opened')).toHaveLength(2);
    expect(capturedEvents('ai_generate_requested')).toHaveLength(1);
  });

  it('flags a real generation as NOT from_cache — this is the billed path', async () => {
    mockedCall.mockResolvedValue({ content: 'fresh', fromCache: false });

    const { result } = await renderHook(() => useAiGenerate(params), createQueryWrapper());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedEvents('ai_generate_succeeded')).toEqual([{ prompt_type: 'explain', from_cache: false }]);
  });

  it('propagates the SERVER cache flag, distinguishing a shared hit from a generation', async () => {
    // A local miss can still be a server-cache hit (shared across users, free).
    // Given the local-hit blind spot above, this is in practice the ONLY way
    // `from_cache: true` reaches PostHog today.
    mockedCall.mockResolvedValue({ content: 'shared', fromCache: true });

    const { result } = await renderHook(() => useAiGenerate(params), createQueryWrapper());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedEvents('ai_generate_succeeded')).toEqual([{ prompt_type: 'explain', from_cache: true }]);
  });

  it('captures the typed error code on failure', async () => {
    // COST_CEILING_REACHED means a Pro user ran out of AI budget — a product
    // signal, not a bug. It's only actionable if the code reaches PostHog.
    mockedCall.mockRejectedValue(new AiGenerateError('COST_CEILING_REACHED', 'out of credits'));

    const { result } = await renderHook(() => useAiGenerate(params), createQueryWrapper());
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(capturedEvents('ai_generate_failed')).toEqual([{ prompt_type: 'explain', code: 'COST_CEILING_REACHED' }]);
  });

  it('reports UNKNOWN for a non-typed error', async () => {
    mockedCall.mockRejectedValue(new Error('socket hang up'));

    const { result } = await renderHook(() => useAiGenerate(params), createQueryWrapper());
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(capturedEvents('ai_generate_failed')).toEqual([{ prompt_type: 'explain', code: 'UNKNOWN' }]);
  });

  it('does not cache a failed generation', async () => {
    mockedCall.mockRejectedValue(new AiGenerateError('GEMINI_ERROR'));

    const { result } = await renderHook(() => useAiGenerate(params), createQueryWrapper());
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(useAiCacheStore.getState().byKey[KEY]).toBeUndefined();
  });

  it('tags every event with the prompt type that distinguishes the five AI tools', async () => {
    mockedCall.mockResolvedValue({ content: 'x', fromCache: false });

    const { result } = await renderHook(
      () => useAiGenerate({ ...params, promptType: 'prayer_prompt' }),
      createQueryWrapper()
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedEvents('ai_generate_requested')).toEqual([{ prompt_type: 'prayer_prompt' }]);
    expect(capturedEvents('ai_generate_succeeded')).toEqual([{ prompt_type: 'prayer_prompt', from_cache: false }]);
  });
});
