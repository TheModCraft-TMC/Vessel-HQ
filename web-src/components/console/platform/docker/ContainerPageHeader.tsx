'use client';

import { useRouteParams } from '@console/console/routing/useRouteParams';

import { PageHeader } from '@/ui/layouts/view-layout';

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
