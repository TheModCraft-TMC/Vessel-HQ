import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/domains/environments';
import { withError } from '@/core/query';
import { azureAciClient } from '@/providers/infrastructure/azure-aci';

import { toResourceGroup } from '../mappers/azure-resources';

import { queryKeys } from './query-keys';

export function useResourceGroup(
  environmentId: EnvironmentId,
  subscriptionId: string,
  resourceGroupName: string
) {
  return useQuery(
    queryKeys.resourceGroup(environmentId, subscriptionId, resourceGroupName),
    () =>
      azureAciClient
        .getResourceGroup(environmentId, subscriptionId, resourceGroupName)
        .then(toResourceGroup),
    {
      ...withError('Unable to retrieve Azure resource group'),
    }
  );
}
