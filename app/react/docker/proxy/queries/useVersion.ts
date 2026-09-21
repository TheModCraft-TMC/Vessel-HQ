import { useQuery } from '@tanstack/react-query';
import { SystemVersion } from 'docker-types';

import { EnvironmentId } from '@/domains/environments';

import { dockerClient } from './dockerClient';

export async function getVersion(environmentId: EnvironmentId) {
  return dockerClient.getVersion(environmentId);
}

export function useVersion<TSelect = SystemVersion>(
  environmentId?: EnvironmentId,
  select?: (info: SystemVersion) => TSelect
) {
  return useQuery(
    ['environment', environmentId!, 'docker', 'version'],
    () => getVersion(environmentId!),
    {
      select,
      enabled: !!environmentId,
    }
  );
}

export function useApiVersion(environmentId?: EnvironmentId) {
  const query = useVersion(environmentId, (info) => info.ApiVersion);
  return query.data ? parseFloat(query.data) : 0;
}
