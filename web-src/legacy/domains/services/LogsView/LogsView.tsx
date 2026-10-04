import { useRouteParams } from '@console/console/routing/useRouteParams';

import { DockerLogsView } from '@/react/docker/logs/DockerLogsView';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { PageHeader } from '@/ui/layouts/view-layout';

import { useService } from '../queries/useService';

export function LogsView() {
  const environmentId = useEnvironmentId();
  const { id } = useRouteParams();
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
          { label: 'Services', link: '/:endpointId/docker/services' },
          {
            label: serviceName,
            link: '/:endpointId/docker/services/:id',
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
