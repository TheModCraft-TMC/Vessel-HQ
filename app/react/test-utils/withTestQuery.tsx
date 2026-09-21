import { ComponentType, PropsWithChildren } from 'react';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { withReactQuery } from '@/core/query/withReactQuery';

export function withTestQueryProvider<T extends object = object>(
  WrappedComponent: ComponentType<PropsWithChildren<T>>,
  {
    onMutationError,
    onQueryError,
  }: {
    onMutationError?(error: unknown): void;
    onQueryError?(error: unknown): void;
  } = {}
) {
  const testQueryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    queryCache: new QueryCache({ onError: onQueryError }),
    mutationCache: new MutationCache({
      onError: onMutationError,
    }),
  });

  return withReactQuery<PropsWithChildren<T>>(WrappedComponent, testQueryClient);
}
