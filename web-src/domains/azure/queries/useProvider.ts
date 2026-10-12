import _ from 'lodash';
import { useQueries } from '@tanstack/react-query';

import { EnvironmentId } from '@/domains/environments';
import { withError } from '@/core/query';
import { azureAciClient } from '@/providers/infrastructure/azure-aci';

import { toProviderViewModel } from '../mappers/azure-resources';
import { Subscription } from '../models';

import { queryKeys } from './query-keys';

export function useProvider(
  environmentId: EnvironmentId,
  subscriptions: Subscription[] = []
) {
  const queries = useQueries({
    queries: subscriptions.map((subscription) => ({
      queryKey: queryKeys.provider(environmentId, subscription.subscriptionId),

      queryFn: async () => {
        const provider = await azureAciClient.getProvider(
          environmentId,
          subscription.subscriptionId
        );
        return [
          subscription.subscriptionId,
          toProviderViewModel(provider),
        ] as const;
      },

      ...withError('Unable to retrieve Azure providers'),
    })),
  });

  return {
    providers: Object.fromEntries(
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
  };
}
