'use client';

import { useSelectedLayoutSegment } from 'next/navigation';
import { useRouteParams } from '@console/console/routing/useRouteParams';

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

  return (
    <PageHeader
      title={title}
      breadcrumbs={[
        { label: 'Containers', link: '/:endpointId/docker/containers' },
        {
          label: params.id,
          link: '/:endpointId/docker/containers/:id',
          linkParams: { id: params.id, nodeName: params.nodeName },
        },
        ...(suffix ? [suffix] : []),
      ]}
      reload={!suffix}
    />
  );
}
