import { useQuery } from '@tanstack/react-query';

import { Event } from '@/domains/clusters/queries/types';
import { EnvironmentId } from '@/domains/environments';
import { withError } from '@/core/query';
import { kubernetesClient } from '@/providers/infrastructure/kubernetes';

import { queryKeys as environmentQueryKeys } from './query-keys';

type RequestOptions = {
  /** if undefined, events are fetched at the cluster scope */
  namespace?: string;
  params?: {
    resourceId?: string;
  };
};

const queryKeys = {
  base: (environmentId: number, { namespace, params }: RequestOptions) => {
    if (namespace) {
      return [
        ...environmentQueryKeys.base(environmentId),
        'events',
        namespace,
        params,
      ] as const;
    }
    return [
      ...environmentQueryKeys.base(environmentId),
      'events',
      params,
    ] as const;
  },
};

type QueryOptions<T> = {
  queryOptions?: {
    autoRefreshRate?: number;
    select?: (data: Event[]) => T;
    enabled?: boolean;
  };
} & RequestOptions;

export function useEvents<T = Event[]>(
  environmentId: EnvironmentId,
  options?: QueryOptions<T>
) {
  const { queryOptions, params, namespace } = options ?? {};
  return useQuery(
    queryKeys.base(environmentId, { params, namespace }),
    () => kubernetesClient.getEvents(environmentId, { ...params, namespace }),
    {
      ...withError('Unable to retrieve events'),
      select: queryOptions?.select,
    }
  );
}

export function useEventWarningsCount(
  environmentId: EnvironmentId,
  options?: QueryOptions<number>
) {
  const { namespace, params } = options ?? {};
  const resourceEventsQuery = useEvents<number>(environmentId, {
    namespace,
    params,
    queryOptions: {
      select: (data) => data.filter((e) => e.type === 'Warning').length,
    },
  });
  return resourceEventsQuery.data || 0;
}
