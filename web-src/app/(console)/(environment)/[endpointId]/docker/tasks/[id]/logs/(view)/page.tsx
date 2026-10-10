'use client';

import { useRouteParams } from '@console/console/routing/useRouteParams';

import { useTask } from '@/domains/services/tasks/queries/useTask';
import { DockerLogsView } from '@app/_components/platform/docker/logs/DockerLogsView';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  const environmentId = useEnvironmentId();
  const params = useRouteParams();
  const taskQuery = useTask(environmentId, params.id);

  if (!taskQuery.data) return null;

  return (
    <>
      <PageHeader
        title="Task logs"
        breadcrumbs={[
          { label: 'Services', link: '/:endpointId/docker/services' },
          {
            label: params.id,
            link: '/:endpointId/docker/tasks/:id',
            linkParams: { id: params.id },
          },
          'Logs',
        ]}
      />
      <DockerLogsView
        environmentId={environmentId}
        resource="tasks"
        resourceId={params.id}
        resourceName={params.id}
        multiplexed
      />
    </>
  );
}
