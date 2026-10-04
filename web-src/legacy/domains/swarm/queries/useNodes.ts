import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/domains/environments';
import { dockerClient } from '@/core/composition/dockerClient';

export function useNodes(
  environmentId: EnvironmentId,
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: ['docker', environmentId, 'nodes'],
    queryFn: () => dockerClient.listNodes(environmentId),
    enabled,
  });
}

export function getNodes(environmentId: EnvironmentId) {
  return dockerClient.listNodes(environmentId);
}
