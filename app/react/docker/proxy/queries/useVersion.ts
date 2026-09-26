import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/domains/environments';
import { type DockerSystemVersion } from '@/providers/infrastructure/docker';
import { dockerClient } from '@/core/composition/dockerClient';

export async function getVersion(environmentId: EnvironmentId) {
  return dockerClient.getVersion(environmentId);
}

export function useVersion<TSelect = DockerSystemVersion>(
  environmentId?: EnvironmentId,
  select?: (info: DockerSystemVersion) => TSelect
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
