import { useCurrentStateAndParams } from '@uirouter/react';

import { DockerLogsView } from '@/react/docker/logs/DockerLogsView';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { PageHeader } from '@/ui/layouts/view-layout';

import { useService } from '../queries/useService';

export function LogsView() {
  const environmentId = useEnvironmentId();
  const {
    params: { id },
  } = useCurrentStateAndParams();
  const serviceQuery = useService(environmentId, id);

  if (!serviceQuery.data) {
    return null;
  }

  const serviceName = serviceQuery.data.Spec?.Name || id;
  return (
    <>
      <PageHeader
        title="Service logs"
        breadcrumbs={[
          { label: 'Services', link: 'docker.services' },
          {
            label: serviceName,
            link: 'docker.services.service',
            linkParams: { id },
          },
          'Logs',
        ]}
      />
      <DockerLogsView
        environmentId={environmentId}
        resource="services"
        resourceId={id}
        resourceName={serviceName}
        multiplexed
      />
    </>
  );
}
