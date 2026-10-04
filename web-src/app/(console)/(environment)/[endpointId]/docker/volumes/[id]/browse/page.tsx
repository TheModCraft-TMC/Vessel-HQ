'use client';

import { useRouteParams } from '@console/console/routing/useRouteParams';

import { VolumeBrowserContent } from '@/domains/volumes/views/BrowseView';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  const params = useRouteParams();

  return (
    <>
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
      <VolumeBrowserContent />
    </>
  );
}
