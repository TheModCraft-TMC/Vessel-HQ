import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { withError } from '@/core/query';
import { buildStackUrl } from '@/domains/stacks/queries/common/buildUrl';
import { queryKeys } from '@/domains/stacks/queries/common/query-keys';
import type { Stack, StackId } from '@/domains/stacks/models/types';
import axios, { parseAxiosError } from '@/shared/http';

export function useStack<T = Stack>(
  stackId?: StackId,
  queryOptions?: UseQueryOptions<Stack, unknown, T>
) {
  return useQuery({
    queryKey: queryKeys.stack(stackId),
    queryFn: () => getStack(stackId),
    enabled: !!stackId,
    ...withError('Unable to retrieve stack'),
    ...queryOptions,
  });
}

async function getStack(stackId?: StackId) {
  if (!stackId) {
    throw new Error('Stack ID is required');
  }

  try {
    const { data } = await axios.get<Stack>(buildStackUrl(stackId));
    return data;
  } catch (error) {
    throw parseAxiosError(error, 'Unable to retrieve stack');
  }
}
