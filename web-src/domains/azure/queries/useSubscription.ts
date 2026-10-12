import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/domains/environments';
import { withError } from '@/core/query';
import { azureAciClient } from '@/providers/infrastructure/azure-aci';

import { toSubscription } from '../mappers/azure-resources';

import { queryKeys } from './query-keys';

export function useSubscription(
  environmentId: EnvironmentId,
  subscriptionId: string
) {
  return useQuery(
    queryKeys.subscription(environmentId, subscriptionId),
    () =>
      azureAciClient
        .getSubscription(environmentId, subscriptionId)
        .then(toSubscription),
    {
      ...withError('Unable to retrieve Azure subscription'),
    }
  );
}
