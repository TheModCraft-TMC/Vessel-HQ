import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/domains/environments';
import { withError } from '@/core/query';
import { azureAciClient } from '@/providers/infrastructure/azure-aci';

import { toContainerGroup } from '../mappers/container-group';

import { queryKeys } from './query-keys';

export function useContainerGroup(
  environmentId: EnvironmentId,
  subscriptionId: string,
  resourceGroupName: string,
  containerGroupName: string
) {
  return useQuery(
    queryKeys.containerGroup(
      environmentId,
      subscriptionId,
      resourceGroupName,
      containerGroupName
    ),
    () =>
      azureAciClient
        .getContainerGroup(
          environmentId,
          subscriptionId,
          resourceGroupName,
          containerGroupName
        )
        .then(toContainerGroup),
    {
      ...withError('Unable to retrieve Azure container group'),
    }
  );
}
