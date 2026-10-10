'use client';

import { useRouteParams } from '@console/console/routing/useRouteParams';

import { VolumeDetailsContent } from '@app/_components/platform/docker/volumes/ItemView';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  const routeParams = useRouteParams();
  return (
    <>
      <PageHeader
        title="Volume details"
        breadcrumbs={[
          { label: 'Volumes', link: '/:endpointId/docker/volumes' },
          routeParams.id,
        ]}
        reload
      />
      <VolumeDetailsContent />
    </>
  );
}
