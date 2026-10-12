import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/domains/environments';
import { withError } from '@/core/query';
import { azureAciClient } from '@/providers/infrastructure/azure-aci';

import { toSubscription } from '../mappers/azure-resources';

import { queryKeys } from './query-keys';

export function useSubscriptions(environmentId: EnvironmentId) {
  return useQuery(
    queryKeys.subscriptions(environmentId),
    () =>
      azureAciClient
        .getSubscriptions(environmentId)
        .then((items) => items.map(toSubscription)),
    {
      ...withError('Unable to retrieve Azure subscriptions'),
    }
  );
}
