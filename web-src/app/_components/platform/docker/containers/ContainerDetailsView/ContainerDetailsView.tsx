import { useRouteParams } from '@console/routing/useRouteParams';
import { PageContent } from '@console/layout/PageContent';

import { useContainer } from '@/domains/containers';
import { AccessControlPanel } from '@/core/access-control/AccessControlPanel';
import type { ContainerDetails } from '@/domains/containers/models';
import { ResourceControlType } from '@/domains/access-control';
import { useEnvironmentId } from '@/core/routing/useEnvironmentId';
import { useEnvironmentRegistries } from '@/domains/environments/queries/useEnvironmentRegistries';
import { Registry } from '@/domains/registries';
import { PageHeader } from '@/ui/layouts/view-layout';
import { ContainerActionsSection } from '@/domains/containers/components/ContainerDetails/ContainerActionsSection/ContainerActionsSection';
import { ContainerStatusSection } from '@/domains/containers/components/ContainerDetails/ContainerStatusSection/ContainerStatusSection';
import { CreateImageSection } from '@/domains/containers/components/ContainerDetails/CreateImageSection/CreateImageSection';
import { ContainerDetailsSection } from '@/domains/containers/components/ContainerDetails/ContainerDetailsSection/ContainerDetailsSection';
import { VolumesSection } from '@/domains/containers/components/ContainerDetails/VolumesSection/VolumesSection';
import { ContainerNetworksDatatable } from '@/domains/containers/components/ContainerDetails/ContainerNetworksDatatable';
import { HealthStatus } from '@/domains/containers/components/ContainerDetails/HealthStatus';
import { findBestMatchRegistry } from '@/domains/images/features/ImageConfigFieldset/findRegistryMatch';
import { ViewLoading } from '@/ui/components/feedback/ViewLoading';

export function ContainerDetailsView() {
  return (
    <>
      <PageHeader title="Container details" breadcrumbs="Containers" />
      <ContainerDetailsContent />
    </>
  );
}

export function ContainerDetailsContent() {
  const environmentId = useEnvironmentId();
  const { id: containerId, nodeName } = useRouteParams();

  const containerQuery = useContainer(
    { environmentId, containerId, nodeName },
    { select: (c) => c }
  );

  const registriesQuery = useEnvironmentRegistries(environmentId);

  if (containerQuery.isLoading || registriesQuery.isLoading) {
    return <ViewLoading message="Loading container details..." />;
  }

  if (!containerQuery.data || !registriesQuery.data) {
    return null;
  }

  const container = containerQuery.data;
  const registryId = getRegistryId(container, registriesQuery.data);

  async function handleSuccess() {
    containerQuery.refetch();
  }

  return (
    <>
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
      </PageContent>

      <AccessControlPanel
        resourceId={container.Id || ''}
        resourceControl={container.ResourceControl}
        resourceType={ResourceControlType.Container}
        onUpdateSuccess={handleSuccess}
        environmentId={environmentId}
      />

      {container.State?.Health && (
        <HealthStatus health={container.State.Health} />
      )}

      <PageContent>
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
      </PageContent>

      {container.NetworkSettings?.Networks && (
        <ContainerNetworksDatatable
          dataset={container.NetworkSettings.Networks}
          containerId={containerId}
          nodeName={nodeName}
        />
      )}
    </>
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

  const registry = findBestMatchRegistry(imageName, registries);
  return registry?.Id;
}
