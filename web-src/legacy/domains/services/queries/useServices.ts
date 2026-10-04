import { useQuery } from '@tanstack/react-query';

import { Service } from '@/providers/infrastructure/docker';
import { dockerClient } from '@/core/composition/dockerClient';
import { withError } from '@/core/query';
import { queryKeys } from '@/domains/services/queries/query-keys';
import { EnvironmentId } from '@/domains/environments';

import { Filters } from '../types';

export function useServices<T = Service>(
  {
    environmentId,
    filters,
  }: { environmentId: EnvironmentId; filters?: Filters },
  {
    enabled,
    select,
  }: { enabled?: boolean; select?: (services: Array<Service>) => Array<T> } = {}
) {
  return useQuery(
    queryKeys.filters(environmentId, filters),
    () => getServices(environmentId, filters),
    {
      ...withError('Unable to retrieve services'),
      enabled,
      select,
    }
  );
}

export async function getServices(
  environmentId: EnvironmentId,
  filters?: Filters
) {
  return dockerClient.listServices(environmentId, filters);
}
