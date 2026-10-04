import { useQuery } from '@tanstack/react-query';

import { Config } from '@/providers/infrastructure/docker';
import { dockerClient } from '@/core/composition/dockerClient';
import { EnvironmentId } from '@/domains/environments';
import { withError } from '@/core/query';

import { queryKeys } from './query-keys';

export function useConfigsList<T>(
  environmentId: EnvironmentId,
  { select }: { select?: (configs: Config[]) => T } = {}
) {
  return useQuery({
    queryKey: queryKeys.list(environmentId),
    queryFn: () => getConfigs(environmentId),
    select,
    ...withError('Unable to retrieve configs'),
  });
}

export async function getConfigs(environmentId: EnvironmentId) {
  return dockerClient.listConfigs(environmentId);
}
