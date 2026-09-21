import { useQuery } from '@tanstack/react-query';
import { Service } from 'docker-types';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { withError } from '@/core/query/query-client';
import { ServiceId } from '@/react/docker/services/types';
import { queryKeys } from '@/react/docker/services/queries/query-keys';
import { EnvironmentId } from '@/domains/environments';
import { buildUrl } from '@/react/docker/services/queries/build-url';
import { PortainerResponse } from '@/react/docker/types';

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
  try {
    const { data } = await axios.get<PortainerResponse<Service>>(
      buildUrl(environmentId, serviceId)
    );

    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to get service');
  }
}
