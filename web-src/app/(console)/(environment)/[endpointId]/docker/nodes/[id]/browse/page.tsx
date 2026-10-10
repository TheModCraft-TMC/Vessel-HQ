'use client';

import { useRouteParams } from '@console/console/routing/useRouteParams';

import { HostBrowserContent } from '@app/_components/platform/docker/host/BrowseView/BrowseView';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  const routeParams = useRouteParams();
  return (
    <>
      <PageHeader
        title="Node browser"
        breadcrumbs={[
          { label: 'Swarm', link: '/:endpointId/docker/swarm' },
          {
            label: routeParams.id,
            link: '/:endpointId/docker/nodes/:id',
            linkParams: { id: routeParams.id },
          },
          'Browse',
        ]}
      />
      <HostBrowserContent mode="node" />
    </>
  );
}
