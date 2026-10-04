'use client';

import { useRouteParams } from '@console/console/routing/useRouteParams';

import { ImageDetailsContent } from '@/domains/images/views/ItemView/ItemView';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  const params = useRouteParams();

  return (
    <>
      <PageHeader
        title="Image details"
        breadcrumbs={[
          { label: 'Images', link: '/:endpointId/docker/images' },
          params.id,
        ]}
        reload
      />
      <ImageDetailsContent />
    </>
  );
}
