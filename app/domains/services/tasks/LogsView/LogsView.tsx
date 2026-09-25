import { useCurrentStateAndParams } from '@uirouter/react';

import { DockerLogsView } from '@/react/docker/logs/DockerLogsView';
import { useService } from '@/domains/services/queries/useService';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { PageHeader } from '@/ui/layouts/view-layout';

import { useTask } from '../queries/useTask';

export function LogsView() {
  const environmentId = useEnvironmentId();
  const {
    params: { id },
  } = useCurrentStateAndParams();
  const taskQuery = useTask(environmentId, id);
  const serviceId = taskQuery.data?.ServiceID || '';
  const serviceQuery = useService(environmentId, serviceId);

  if (!taskQuery.data || !serviceQuery.data) {
    return null;
  }

  const serviceName = serviceQuery.data.Spec?.Name || serviceId;
  return (
    <>
      <PageHeader
        title="Task logs"
        breadcrumbs={[
          { label: 'Services', link: 'docker.services' },
          {
            label: serviceName,
            link: 'docker.services.service',
            linkParams: { id: serviceId },
          },
          {
            label: id,
            link: 'docker.tasks.task',
            linkParams: { id },
          },
          'Logs',
        ]}
      />
      <DockerLogsView
        environmentId={environmentId}
        resource="tasks"
        resourceId={id}
        resourceName={id}
        multiplexed
      />
    </>
  );
}
