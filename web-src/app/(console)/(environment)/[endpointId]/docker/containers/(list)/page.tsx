'use client';

import { EnvironmentType } from '@/domains/environments';
import { ContainersDatatable } from '@/domains/containers/views/ContainersDatatable/ContainersDatatable';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useInfo } from '@/react/docker/proxy/queries/useInfo';
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
      <ContainersDatatable
        isHostColumnVisible={isAgent && Boolean(swarmQuery.data)}
        environment={environment}
      />
    </>
  );
}
