'use client';

import { useRouteParams } from '@console/console/routing/useRouteParams';

import { useService } from '@/domains/services/queries/useService';
import { DockerLogsView } from '@app/_components/platform/docker/logs/DockerLogsView';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  const environmentId = useEnvironmentId();
  const params = useRouteParams();
  const serviceQuery = useService(environmentId, params.id);

  if (!serviceQuery.data) return null;

  return (
    <>
      <PageHeader
        title="Service logs"
        breadcrumbs={[
          { label: 'Services', link: '/:endpointId/docker/services' },
          {
            label: params.id,
            link: '/:endpointId/docker/services/:id',
            linkParams: { id: params.id },
          },
          'Logs',
        ]}
      />
      <DockerLogsView
        environmentId={environmentId}
        resource="services"
        resourceId={params.id}
        resourceName={serviceQuery.data.Spec?.Name || params.id}
        multiplexed
      />
    </>
  );
}
