'use client';

import { useRouteParams } from '@console/console/routing/useRouteParams';

import { HostBrowserContent } from '@/react/docker/host/BrowseView/BrowseView';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  const params = useRouteParams();

  return (
    <>
      <PageHeader
        title="Node browser"
        breadcrumbs={[
          { label: 'Swarm', link: '/:endpointId/docker/swarm' },
          {
            label: params.id,
            link: '/:endpointId/docker/nodes/:id',
            linkParams: { id: params.id },
          },
          'Browse',
        ]}
      />
      <HostBrowserContent mode="node" />
    </>
  );
}
