import { useQuery } from '@tanstack/react-query';

import {
  edgeAgentClient as axios,
  parseAxiosError,
} from '@/providers/infrastructure/edge-agent';
import { EnvironmentId } from '@/domains/environments';

import { EdgeJob } from '../../models/edge-job';

import { buildUrl } from './build-url';
import { queryKeys } from './query-keys';

export interface EdgeJobResponse extends Omit<EdgeJob, 'Endpoints'> {
  Endpoints: Array<EnvironmentId> | null;
}

async function getEdgeJob(id: EdgeJobResponse['Id']) {
  try {
    const { data } = await axios.get<EdgeJobResponse>(buildUrl({ id }));
    return data;
  } catch (err) {
    throw parseAxiosError(err, 'Failed fetching edge job');
  }
}

export function useEdgeJob<T = EdgeJobResponse>(
  id: EdgeJobResponse['Id'],
  {
    select,
  }: {
    select?: (job: EdgeJobResponse) => T;
  } = {}
) {
  return useQuery(queryKeys.item(id), () => getEdgeJob(id), { select });
}
