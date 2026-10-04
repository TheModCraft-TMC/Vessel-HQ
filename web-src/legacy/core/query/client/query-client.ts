import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { handleQueryError } from '../errors/query-errors';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        networkMode: 'offlineFirst',
        // Keep recently visited views warm so browser back/forward navigation
        // does not immediately repeat the same API requests.
        staleTime: 30_000,
        cacheTime: 10 * 60_000,
        keepPreviousData: true,
        refetchOnWindowFocus: false,
      },
    },
    mutationCache: new MutationCache({
      onError: (error, variable, context, mutation) => {
        handleQueryError(error, mutation.meta?.error);
      },
    }),
    queryCache: new QueryCache({
      onError: (error, mutation) => {
        handleQueryError(error, mutation.meta?.error);
      },
    }),
  });
}

export const queryClient = createQueryClient();
