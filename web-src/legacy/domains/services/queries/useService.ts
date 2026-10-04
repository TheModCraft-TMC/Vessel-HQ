import { useQuery } from '@tanstack/react-query';

import { dockerClient } from '@/core/composition/dockerClient';
import { withError } from '@/core/query';
import { ServiceId } from '@/domains/services/types';
import { queryKeys } from '@/domains/services/queries/query-keys';
import { EnvironmentId } from '@/domains/environments';

export function useService(environmentId: EnvironmentId, serviceId: ServiceId) {
  return useQuery(
    queryKeys.service(environmentId, serviceId),
    () => getService(environmentId, serviceId),
    {
      enabled: !!serviceId,
      ...withError('Unable to retrieve service'),
    }
  );
}

export async function getService(
  environmentId: EnvironmentId,
  serviceId: ServiceId
) {
  return dockerClient.inspectService(environmentId, serviceId);
}
