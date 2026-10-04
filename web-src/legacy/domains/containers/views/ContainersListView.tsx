import { useInfo } from '@/domains/containers/hooks/useDockerSystem';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { EnvironmentType } from '@/domains/environments';
import { PageHeader } from '@/ui/layouts/view-layout';

import { ContainersDatatable } from './ContainersDatatable';

export function ContainersListView() {
  const environmentId = useEnvironmentId();
  const environmentQuery = useCurrentEnvironment();
  const environment = environmentQuery.data;
  const envInfoQuery = useInfo(environmentId, {
    select: (info) => !!info.Swarm?.NodeID,
  });

  if (!environment) {
    return null;
  }

  const isAgent =
    environment.Type === EnvironmentType.AgentOnDocker ||
    environment.Type === EnvironmentType.EdgeAgentOnDocker;

  const isSwarmManager = !!envInfoQuery.data;
  const isHostColumnVisible = isAgent && isSwarmManager;
  return (
    <>
      <PageHeader
        title="Container list"
        breadcrumbs={[{ label: 'Containers' }]}
        reload
      />

      <ContainersDatatable
        isHostColumnVisible={isHostColumnVisible}
        environment={environment}
      />
    </>
  );
}
