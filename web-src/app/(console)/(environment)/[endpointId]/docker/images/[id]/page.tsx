'use client';

import { useRouteParams } from '@console/console/routing/useRouteParams';

import { ImageDetailsContent } from '@app/_components/platform/docker/images/ItemView/ItemView';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  const routeParams = useRouteParams();
  return (
    <>
      <PageHeader
        title="Image details"
        breadcrumbs={[
          { label: 'Images', link: '/:endpointId/docker/images' },
          routeParams.id,
        ]}
        reload
      />
      <ImageDetailsContent />
    </>
  );
}
