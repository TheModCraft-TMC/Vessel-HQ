import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/domains/azure/queries/query-keys';
import { EnvironmentId } from '@/domains/environments';
import PortainerError from '@/portainer/error';
import { azureAciClient } from '@/providers/infrastructure/azure-aci';
import { ContainerGroup, ResourceGroup } from '@/domains/azure/models';
import { ContainerInstanceFormValues } from '@/domains/azure/types';
import { applyResourceControl } from '@/react/portainer/access-control/access-control.service';

import { toContainerGroup } from '../mappers/container-group';
import { getSubscriptionResourceGroups } from '../components/ContainerInstances/CreateView/utils';

export function useCreateInstanceMutation(
  resourceGroups: {
    [k: string]: ResourceGroup[];
  },
  environmentId: EnvironmentId
) {
  const queryClient = useQueryClient();
  return useMutation<ContainerGroup, unknown, ContainerInstanceFormValues>(
    (values) => {
      if (!values.subscription) {
        throw new PortainerError('subscription is required');
      }

      const subscriptionResourceGroup = getSubscriptionResourceGroups(
        values.subscription,
        resourceGroups
      );
      const resourceGroup = subscriptionResourceGroup.find(
        (r) => r.value === values.resourceGroup
      );
      if (!resourceGroup) {
        throw new PortainerError('resource group not found');
      }

      return azureAciClient
        .createContainerGroup(
          values,
          environmentId,
          values.subscription,
          resourceGroup.label
        )
        .then(toContainerGroup);
    },
    {
      async onSuccess(containerGroup, values) {
        const resourceControl = containerGroup.resourceControl;
        if (!resourceControl) {
          throw new PortainerError('resource control expected after creation');
        }

        const accessControlData = values.accessControl;
        await applyResourceControl(accessControlData, resourceControl.Id);
        return queryClient.invalidateQueries(
          queryKeys.subscriptions(environmentId)
        );
      },
    }
  );
}
