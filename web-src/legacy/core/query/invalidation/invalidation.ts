import { QueryClient, QueryKey } from '@tanstack/react-query';

export function withInvalidate(
  queryClient: QueryClient,
  queryKeysToInvalidate: QueryKey[],
  { skipRefresh }: { skipRefresh?: boolean } = {}
) {
  return {
    onSuccess() {
      const promise = Promise.all(
        queryKeysToInvalidate.map((keys) => queryClient.invalidateQueries(keys))
      );
      return skipRefresh ? undefined : promise;
    },
  };
}

export function invalidateAllQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries();
}
