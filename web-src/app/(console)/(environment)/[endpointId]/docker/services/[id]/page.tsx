'use client';

import { useRouteParams } from '@console/console/routing/useRouteParams';

import { ServiceItemContent } from '@/domains/services/ItemView/ItemView';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  const params = useRouteParams();

  return (
    <>
      <PageHeader
        title="Service details"
        breadcrumbs={[
          { label: 'Services', link: '/:endpointId/docker/services' },
          params.id,
        ]}
        reload
      />
      <ServiceItemContent />
    </>
  );
}
