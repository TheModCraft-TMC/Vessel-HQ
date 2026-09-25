import { useRouter, useCurrentStateAndParams } from '@uirouter/react';
import { useQueryClient } from '@tanstack/react-query';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { AccessControlPanel } from '@/react/portainer/access-control/AccessControlPanel/AccessControlPanel';
import {
  ResourceControlResponse,
  ResourceControlType,
} from '@/react/portainer/access-control/types';
import type { ContainerListViewModel } from '@/domains/containers';
import { ResourceControlViewModel } from '@/react/portainer/access-control/models/ResourceControlViewModel';
import { useContainers } from '@/domains/containers';
import { notifySuccess } from '@/ui/components/toast/notifications';
import { PageHeader } from '@/ui/layouts/view-layout';
import { useDeleteNetwork } from '@/domains/networks/queries/useDeleteNetworkMutation';
import { useDisconnectContainer } from '@/domains/networks/queries/useDisconnectContainerMutation';
import {
  getIPv4Configs,
  getIPv6Configs,
  isSystemNetwork,
} from '@/domains/networks';
import { NetworkResponseContainers } from '@/domains/networks/models/network';
import { queryKeys } from '@/domains/networks/queries/queryKeys';
import { useNetwork } from '@/domains/networks/queries/useNetwork';
import { NetworkDetailsTable } from '@/domains/networks/components/NetworkDetail/NetworkDetailsTable';
import { NetworkOptionsTable } from '@/domains/networks/components/NetworkDetail/NetworkOptionsTable';
import { NetworkContainersTable } from '@/domains/networks/components/NetworkDetail/NetworkContainersTable';

export function ItemView() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    params: { id: networkId, nodeName },
  } = useCurrentStateAndParams();
  const environmentId = useEnvironmentId();
  const networkQuery = useNetwork(environmentId, networkId, { nodeName });
  const deleteNetworkMutation = useDeleteNetwork(environmentId);
  const disconnectContainerMutation = useDisconnectContainer({
    environmentId,
    networkId,
  });
  const containersQuery = useContainers(environmentId, {
    filters: {
      network: [networkId],
    },
    nodeName,
  });

  if (!networkQuery.data) {
    return null;
  }

  const network = networkQuery.data;

  const networkContainers = filterContainersInNetwork(
    network.Containers,
    containersQuery.data
  );
  const resourceControl = network.Portainer?.ResourceControl
    ? new ResourceControlViewModel(
        network.Portainer.ResourceControl as unknown as ResourceControlResponse
      )
    : undefined;

  return (
    <>
      <PageHeader
        title="Network details"
        breadcrumbs={[
          { link: 'docker.networks', label: 'Networks' },
          {
            link: 'docker.networks.network',
            label: networkQuery.data.Name,
          },
        ]}
        reload
      />
      <NetworkDetailsTable
        network={networkQuery.data}
        ipv4Configs={getIPv4Configs(networkQuery.data.IPAM?.Config)}
        ipv6Configs={getIPv6Configs(networkQuery.data.IPAM?.Config)}
        allowRemoveNetwork={!isSystemNetwork(networkQuery.data.Name)}
        onRemoveNetworkClicked={onRemoveNetworkClicked}
      />

      <AccessControlPanel
        onUpdateSuccess={() =>
          queryClient.invalidateQueries(
            queryKeys.item(environmentId, networkId)
          )
        }
        resourceControl={resourceControl}
        resourceType={ResourceControlType.Network}
        disableOwnershipChange={isSystemNetwork(networkQuery.data.Name)}
        resourceId={networkId}
        environmentId={environmentId}
      />
      <NetworkOptionsTable options={networkQuery.data.Options} />
      <NetworkContainersTable
        networkContainers={networkContainers}
        nodeName={nodeName}
        onDisconnect={(containerId, selectedNodeName) =>
          disconnectContainerMutation.mutate(
            { containerId, nodeName: selectedNodeName },
            {
              onSuccess: () =>
                notifySuccess('Container successfully disconnected', networkId),
            }
          )
        }
      />
    </>
  );

  async function onRemoveNetworkClicked() {
    deleteNetworkMutation.mutate(
      { networkId, nodeName },
      {
        onSuccess: () => {
          notifySuccess('Network successfully removed', networkId);
          router.stateService.go('docker.networks');
        },
      }
    );
  }
}

function filterContainersInNetwork(
  networkContainers?: NetworkResponseContainers,
  containers: ContainerListViewModel[] = []
) {
  if (!networkContainers) {
    return [];
  }

  return containers
    .filter((container) => networkContainers[container.Id])
    .map((container) => ({
      ...networkContainers[container.Id],
      Id: container.Id,
    }));
}
