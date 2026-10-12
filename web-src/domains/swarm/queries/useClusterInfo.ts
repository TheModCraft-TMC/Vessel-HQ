import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/domains/environments';
import { dockerClient } from '@/core/composition/dockerClient';

export function useInfo(environmentId: EnvironmentId) {
  return useQuery({
    queryKey: ['docker', environmentId, 'info'],
    queryFn: () => dockerClient.getInfo(environmentId),
  });
}

export function useVersion(environmentId: EnvironmentId) {
  return useQuery({
    queryKey: ['docker', environmentId, 'version'],
    queryFn: () => dockerClient.getVersion(environmentId),
  });
}
