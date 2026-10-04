'use client';

import { useRouteParams } from '@console/console/routing/useRouteParams';

import { VolumeDetailsContent } from '@/domains/volumes/views/ItemView';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  const params = useRouteParams();

  return (
    <>
      <PageHeader
        title="Volume details"
        breadcrumbs={[
          { label: 'Volumes', link: '/:endpointId/docker/volumes' },
          params.id,
        ]}
        reload
      />
      <VolumeDetailsContent />
    </>
  );
}
