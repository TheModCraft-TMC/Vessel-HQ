'use client';

import { PageContent } from '@console/layout/PageContent';

import { EnvironmentType } from '@/domains/environments/types';
import { ContainersDatatable } from '@/domains/containers/views/ContainersDatatable/ContainersDatatable';
import { useCurrentEnvironment } from '@/core/composition/useCurrentEnvironment';
import { useEnvironmentId } from '@/core/routing/useEnvironmentId';
import { useInfo } from '@/core/composition/useDockerInfo';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  const environmentId = useEnvironmentId();
  const environmentQuery = useCurrentEnvironment();
  const swarmQuery = useInfo(environmentId, {
    select: (info) => Boolean(info.Swarm?.NodeID),
  });
  const environment = environmentQuery.data;

  if (!environment) return null;

  const isAgent =
    environment.Type === EnvironmentType.AgentOnDocker ||
    environment.Type === EnvironmentType.EdgeAgentOnDocker;

  return (
    <>
      <PageHeader title="Container list" breadcrumbs="Containers" reload />
      <PageContent gap="none">
        <ContainersDatatable
          flush
          isHostColumnVisible={isAgent && Boolean(swarmQuery.data)}
          environment={environment}
        />
      </PageContent>
    </>
  );
}
