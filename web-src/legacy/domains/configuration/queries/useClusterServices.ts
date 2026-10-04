import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { withError } from '@/core/query';
import type { EnvironmentId } from '@/domains/environments';

import {
  deleteServices,
  getClusterServices,
  getService,
  queryKeys,
} from '../services/service';
import type { Service } from '../services/types';

export function useClusterServices<T = Service[]>(
  environmentId: EnvironmentId,
  options?: {
    autoRefreshRate?: number;
    withApplications?: boolean;
    select?: (services: Service[]) => T;
  }
) {
  return useQuery(
    queryKeys.clusterServices(environmentId),
    async () => getClusterServices(environmentId, options?.withApplications),
    {
      ...withError('Unable to get services.'),
      refetchInterval: options?.autoRefreshRate,
      select: options?.select,
    }
  );
}

export function useServicesQuery<T extends Service | string = Service>(
  environmentId: EnvironmentId,
  namespace: string,
  serviceNames: string[],
  options?: { yaml?: boolean }
) {
  return useQuery(
    ['environments', environmentId, 'kubernetes', 'services', serviceNames],
    async () =>
      Promise.all(
        serviceNames.map((serviceName) =>
          getService<T>(environmentId, namespace, serviceName, options?.yaml)
        )
      ),
    {
      ...withError('Unable to retrieve services.'),
      enabled: !!serviceNames?.length,
    }
  );
}

export function useMutationDeleteServices(environmentId: EnvironmentId) {
  const queryClient = useQueryClient();
  return useMutation(deleteServices, {
    onSuccess: () =>
      queryClient.invalidateQueries(queryKeys.clusterServices(environmentId)),
    ...withError('Unable to delete service(s)'),
  });
}
