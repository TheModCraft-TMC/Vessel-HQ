import { useQuery } from '@tanstack/react-query';

import { withError } from '@/core/query';
import { Stack } from '@/domains/stacks/models/types';
import { buildStackUrl } from '@/domains/stacks/queries/common/buildUrl';
import { queryKeys } from '@/domains/stacks/queries/common/query-keys';
import axios, { parseAxiosError } from '@/shared/http';

export function useStacks({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery(queryKeys.base(), () => getStacks(), {
    enabled,
    ...withError('Failed loading stack'),
  });
}

export async function getStacks(filters?: Record<string, unknown>) {
  try {
    const { data } = await axios.get<Stack[]>(buildStackUrl(), {
      params: filters ? { filters: JSON.stringify(filters) } : undefined,
    });
    return data;
  } catch (error) {
    throw parseAxiosError(error as Error);
  }
}
