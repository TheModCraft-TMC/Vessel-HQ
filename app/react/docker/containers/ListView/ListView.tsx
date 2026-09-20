import { useInfo } from '@/react/docker/proxy/queries/useInfo';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { isAgentEnvironment } from '@/react/portainer/environments/utils';

import { PageHeader } from '@@/PageHeader';

import { ContainersDatatable } from './ContainersDatatable';

export function ListView() {
  const environmentId = useEnvironmentId();
  const environmentQuery = useCurrentEnvironment();
  const environment = environmentQuery.data;
  const envInfoQuery = useInfo(environmentId, {
    select: (info) => !!info.Swarm?.NodeID,
  });

  if (!environment) {
    return null;
  }

  const isAgent = isAgentEnvironment(environment.Type);

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
