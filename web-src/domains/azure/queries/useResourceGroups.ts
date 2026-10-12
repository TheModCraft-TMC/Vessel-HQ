import _ from 'lodash';
import { useQueries } from '@tanstack/react-query';

import { EnvironmentId } from '@/domains/environments';
import { withError } from '@/core/query';
import { azureAciClient } from '@/providers/infrastructure/azure-aci';

import { toResourceGroup } from '../mappers/azure-resources';
import { Subscription } from '../models';

import { queryKeys } from './query-keys';

export function useResourceGroups(
  environmentId: EnvironmentId,
  subscriptions: Subscription[] = []
) {
  const queries = useQueries({
    queries: subscriptions.map((subscription) => ({
      queryKey: queryKeys.resourceGroups(
        environmentId,
        subscription.subscriptionId
      ),

      queryFn: async () => {
        const groups = await azureAciClient.getResourceGroups(
          environmentId,
          subscription.subscriptionId
        );
        return [
          subscription.subscriptionId,
          groups.map(toResourceGroup),
        ] as const;
      },

      ...withError('Unable to retrieve Azure resource groups'),
    })),
  });

  return {
    resourceGroups: Object.fromEntries(
      _.compact(
        queries.map((q) => {
          if (q.data) {
            return q.data;
          }

          return null;
        })
      )
    ),
    isLoading: queries.some((q) => q.isLoading),
    isError: queries.some((q) => q.isError),
  };
}
