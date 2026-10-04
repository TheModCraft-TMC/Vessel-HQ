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
  Endpoints: Array<EnvironmentId>;
}

async function getEdgeJobFile(id: EdgeJobResponse['Id']) {
  try {
    const { data } = await axios.get<{ FileContent: string }>(
      buildUrl({ id, action: 'file' })
    );
    return data.FileContent;
  } catch (err) {
    throw parseAxiosError(err, 'Failed fetching edge job file');
  }
}

export function useEdgeJobFile(id: EdgeJobResponse['Id']) {
  return useQuery(queryKeys.file(id), () => getEdgeJobFile(id));
}
