'use client';

import { useSelectedLayoutSegment } from 'next/navigation';
import { useRouteParams } from '@console/routing/useRouteParams';

import { useContainer } from '@/domains/containers';
import { useEnvironmentId } from '@/core/routing/useEnvironmentId';
import { PageHeader } from '@/ui/layouts/view-layout';

const routeHeaders: Record<string, { title: string; suffix: string }> = {
  attach: { title: 'Container console', suffix: 'Console' },
  exec: { title: 'Container console', suffix: 'Console' },
  inspect: { title: 'Container inspect', suffix: 'Inspect' },
  logs: { title: 'Container logs', suffix: 'Logs' },
  stats: { title: 'Container statistics', suffix: 'Stats' },
};

export function ContainerRouteHeader() {
  const segment = useSelectedLayoutSegment();
  const header = segment ? routeHeaders[segment] : undefined;

  return (
    <ContainerPageHeader
      title={header?.title || 'Container details'}
      suffix={header?.suffix}
    />
  );
}

export function ContainerPageHeader({
  title,
  suffix,
}: {
  title: string;
  suffix?: string;
}) {
  const params = useRouteParams();
  const environmentId = useEnvironmentId();
  const containerQuery = useContainer(
    {
      environmentId,
      containerId: params.id,
      nodeName: params.nodeName,
    },
    {
      select: (container) =>
        container.Name?.replace(/^\//, '') || container.Id || params.id,
    }
  );
  const containerName = containerQuery.data || params.id;

  return (
    <PageHeader
      title={title}
      breadcrumbs={[
        { label: 'Containers', link: '/:endpointId/docker/containers' },
        {
          label: containerName,
          link: '/:endpointId/docker/containers/:id',
          linkParams: { id: params.id, nodeName: params.nodeName },
        },
        ...(suffix ? [suffix] : []),
      ]}
      reload={!suffix}
    />
  );
}
