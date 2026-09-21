import _ from 'lodash';
import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';

import { withError } from '@/core/query/query-client';
import { EnvironmentId } from '@/domains/environments';
import { azureAciClient } from '@/providers/infrastructure/azure-aci';

import { toContainerGroup } from '../mappers/container-group';
import { Subscription } from '../types';

import { queryKeys } from './query-keys';

export function useContainerGroups(
  environmentId: EnvironmentId,
  subscriptions: Subscription[] = [],
  enabled?: boolean
) {
  const queries = useQueries({
    queries: useMemo(
      () =>
        subscriptions.map((subscription) => ({
          queryKey: queryKeys.containerGroups(
            environmentId,
            subscription.subscriptionId
          ),
          queryFn: async () =>
            azureAciClient
              .getContainerGroups(environmentId, subscription.subscriptionId)
              .then((containerGroups) => containerGroups.map(toContainerGroup)),
          ...withError('Unable to retrieve Azure container groups'),
          enabled,
        })),
      [subscriptions, enabled, environmentId]
    ),
  });

  return useMemo(
    () => ({
      containerGroups: _.flatMap(_.compact(queries.map((q) => q.data))),
      isLoading: queries.some((q) => q.isLoading),
    }),
    [queries]
  );
}
