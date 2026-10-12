import { useQuery } from '@tanstack/react-query';

import { withError } from '@/core/query';
import { sourceQueryKeys } from '@/domains/gitops/sources/queries/query-keys';
import type { SourceStatus } from '@/domains/gitops/sources/types';
import axios from '@/shared/http';

export type SourcesSummary = Record<SourceStatus, number>;

async function getSourcesSummary(): Promise<SourcesSummary> {
  const { data } = await axios.get<SourcesSummary>('/gitops/sources/summary');
  return data;
}

export function useSourcesSummary() {
  return useQuery({
    queryKey: sourceQueryKeys.summary(),
    queryFn: getSourcesSummary,
    ...withError('Failed loading sources summary'),
  });
}
