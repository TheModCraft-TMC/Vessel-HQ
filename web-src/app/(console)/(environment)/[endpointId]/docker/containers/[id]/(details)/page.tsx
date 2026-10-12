'use client';

import { useCallback } from 'react';
import { useRouteParams } from '@console/routing/useRouteParams';
import { PageContent } from '@console/layout/PageContent';

import { useContainer } from '@/domains/containers/queries/useContainer';
import type { ContainerDetails } from '@/domains/containers/models';
import { ContainerActionsSection } from '@/domains/containers/components/ContainerDetails/ContainerActionsSection/ContainerActionsSection';
import { ContainerStatusSection } from '@/domains/containers/components/ContainerDetails/ContainerStatusSection/ContainerStatusSection';
import { CreateImageSection } from '@/domains/containers/components/ContainerDetails/CreateImageSection/CreateImageSection';
import { ContainerDetailsSection } from '@/domains/containers/components/ContainerDetails/ContainerDetailsSection/ContainerDetailsSection';
import { VolumesSection } from '@/domains/containers/components/ContainerDetails/VolumesSection/VolumesSection';
import { ContainerNetworksDatatable } from '@/domains/containers/components/ContainerDetails/ContainerNetworksDatatable';
import { HealthStatus } from '@/domains/containers/components/ContainerDetails/HealthStatus';
import type { Registry } from '@/domains/registries/models/registry';
import { useEnvironmentId } from '@/core/routing/useEnvironmentId';
import { AccessControlPanel } from '@/core/access-control/AccessControlPanel';
import { ResourceControlType } from '@/domains/access-control/types';
import { useEnvironmentRegistries } from '@/domains/environments/queries/useEnvironmentRegistries';
import { findBestMatchRegistry } from '@/domains/images/features/ImageConfigFieldset/findRegistryMatch';
import { ViewLoading } from '@/ui/components/feedback/ViewLoading';

export default function Page() {
  const environmentId = useEnvironmentId();
  const { id: containerId, nodeName } = useRouteParams();
  const containerQuery = useContainer(
    { environmentId, containerId, nodeName },
    { select: (container) => container }
  );
  const registriesQuery = useEnvironmentRegistries(environmentId);
  const handleAccessUpdate = useCallback(async () => {
    await containerQuery.refetch();
  }, [containerQuery]);

  if (containerQuery.isLoading || registriesQuery.isLoading) {
    return <ViewLoading message="Loading container details..." />;
  }

  if (!containerQuery.data || !registriesQuery.data) {
    return null;
  }

  const container = containerQuery.data;
  const registryId = getRegistryId(container, registriesQuery.data);

  return (
    <PageContent>
      <ContainerActionsSection
        environmentId={environmentId}
        nodeName={nodeName}
        container={container}
      />
      <ContainerStatusSection
        environmentId={environmentId}
        nodeName={nodeName}
        container={container}
        registryId={registryId}
      />
      <AccessControlPanel
        flush
        resourceId={container.Id || ''}
        resourceControl={container.ResourceControl}
        resourceType={ResourceControlType.Container}
        onUpdateSuccess={handleAccessUpdate}
        environmentId={environmentId}
      />

      {container.State?.Health && (
        <HealthStatus flush health={container.State.Health} />
      )}

      <CreateImageSection
        environmentId={environmentId}
        containerId={container.Id || ''}
      />
      <ContainerDetailsSection
        environmentId={environmentId}
        container={container}
        nodeName={nodeName}
      />
      <VolumesSection volumes={container.Mounts} nodeName={nodeName} />

      {container.NetworkSettings?.Networks && (
        <ContainerNetworksDatatable
          flush
          dataset={container.NetworkSettings.Networks}
          containerId={containerId}
          nodeName={nodeName}
        />
      )}
    </PageContent>
  );
}

function getRegistryId(
  container: ContainerDetails,
  registries?: Array<Registry>
) {
  const imageName = container.Config?.Image;
  if (!imageName || !registries) {
    return undefined;
  }

  return findBestMatchRegistry(imageName, registries)?.Id;
}
