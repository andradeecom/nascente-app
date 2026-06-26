import { useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Refetch React Query queries when the screen gains focus. React Native has no
 * browser window, so React Query's `refetchOnWindowFocus` never fires — without
 * this, a tab switch back to a screen serves stale cache and doesn't re-fetch.
 * This bridges expo-router's focus event to a refetch, the React-Query analogue
 * of `useSyncOnFocus` (which covers the Zustand/sync-engine surfaces).
 *
 * Only **stale** queries are refetched (respecting each query's `staleTime`), so
 * a rapid tab toggle doesn't hammer the network; an already-fetching or
 * disabled/guest query is skipped by React Query's own refetch guards.
 *
 * Pass the query results you want kept fresh:
 *   useRefetchOnFocus(activePlans, suggestedPlans);
 */
export function useRefetchOnFocus(...queries: Pick<UseQueryResult, 'refetch' | 'isStale'>[]): void {
  // `useFocusEffect` runs its callback on every focus regardless of the dep
  // array, so reading the latest `queries` off a ref keeps the effect stable
  // (no per-render re-subscribe) while still acting on current query state. The
  // ref is synced in an effect (not during render) per the React Compiler rules.
  const ref = useRef(queries);
  useEffect(() => {
    ref.current = queries;
  });

  useFocusEffect(
    useCallback(() => {
      for (const query of ref.current) {
        if (query.isStale) void query.refetch();
      }
    }, [])
  );
}
