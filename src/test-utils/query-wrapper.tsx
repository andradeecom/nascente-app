import React, { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * A `renderHook` wrapper providing an isolated `QueryClient` per test.
 *
 * Retries are off so a rejected `queryFn` surfaces as an error state on the first
 * tick instead of hanging the test through React Query's backoff schedule, and
 * `gcTime: Infinity` keeps cache entries alive for the assertion phase. Never
 * share the app's `src/lib/query-client.ts` singleton here — cache would leak
 * between tests and make them order-dependent.
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
}

/**
 * `renderHook` options carrying an isolated `QueryClient`, spreadable directly:
 *
 * ```ts
 * const { result } = await renderHook(() => useThing(), createQueryWrapper());
 * const { result } = await renderHook(fn, { ...createQueryWrapper(), initialProps });
 * ```
 *
 * It returns **only** `{ wrapper }` on purpose. RNTL validates its options and
 * logs "Unknown option(s) passed to renderHook" for anything else, so returning
 * the client alongside it made every spread call site warn. A test that needs to
 * inspect or seed the cache should build the pair itself:
 *
 * ```ts
 * const queryClient = createTestQueryClient();
 * const wrapper = ({ children }) => (
 *   <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
 * );
 * ```
 *
 * ⚠️ **RNTL 14's `renderHook` is async** — it returns a Promise, and `rerender` /
 * `unmount` are async too. Always `await renderHook(...)`; forgetting leaves
 * `result` undefined and every assertion fails with the misleading
 * "Cannot read properties of undefined (reading 'current')".
 */
export function createQueryWrapper(): {
  wrapper: ({ children }: { children: ReactNode }) => React.JSX.Element;
} {
  const queryClient = createTestQueryClient();

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { wrapper };
}
