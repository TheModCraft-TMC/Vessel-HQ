import { useQuery } from '@tanstack/react-query';

import { withError } from '@/core/query';
import {
  edgeAgentClient as axios,
  parseAxiosError,
} from '@/providers/infrastructure/edge-agent';

import { EdgeStack } from '../../models/edge-stack';

import { buildUrl } from './buildUrl';
import { queryKeys } from './query-keys';

type QueryParams = {
  summarizeStatuses?: boolean;
};

export function useEdgeStacks<T extends EdgeStack[] = EdgeStack[]>({
  params,
}: {
  params?: QueryParams;
} = {}) {
  return useQuery({
    queryKey: queryKeys.base(),
    queryFn: () => getEdgeStacks<T>(params),
    ...withError('Failed loading Edge stack'),
  });
}

async function getEdgeStacks<T extends EdgeStack[] = EdgeStack[]>(
  params: QueryParams = {}
) {
  try {
    const { data } = await axios.get<T>(buildUrl(), { params });
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}
