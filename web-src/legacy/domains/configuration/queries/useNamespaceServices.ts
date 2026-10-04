import { useQuery, UseQueryOptions } from '@tanstack/react-query';

import { EnvironmentId } from '@/domains/environments';
import { error as notifyError } from '@/ui/components/toast/notifications';

import type { Service } from '../services/types';
import { getServices } from '../services/service';

export function useNamespaceServices<T = Service[]>(
  environmentId: EnvironmentId,
  namespace: string,
  queryOptions?: UseQueryOptions<Service[], unknown, T>
) {
  return useQuery({
    queryKey: [
      'environments',
      environmentId,
      'kubernetes',
      'namespaces',
      namespace,
      'services',
    ],
    queryFn: () => getServices(environmentId, namespace),
    onError: (err) => {
      notifyError('Failure', err as Error, 'Unable to get services');
    },
    ...queryOptions,
  });
}
