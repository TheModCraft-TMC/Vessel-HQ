import { QueryClient } from '@tanstack/react-query';

/** Clears data that must not survive an authentication boundary. */
export function clearQueryCache(queryClient: QueryClient) {
  queryClient.clear();
}
