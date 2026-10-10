'use client';

import { useRouteParams } from '@console/console/routing/useRouteParams';

import { PageHeader } from '@/ui/layouts/view-layout';

export function VolumeBrowserHeader() {
  const params = useRouteParams();

  return (
    <PageHeader
      title="Volume browser"
      breadcrumbs={[
        { label: 'Volumes', link: '/:endpointId/docker/volumes' },
        {
          label: params.id,
          link: '/:endpointId/docker/volumes/:id',
          linkParams: { id: params.id, nodeName: params.nodeName },
        },
        'Browse',
      ]}
    />
  );
}
