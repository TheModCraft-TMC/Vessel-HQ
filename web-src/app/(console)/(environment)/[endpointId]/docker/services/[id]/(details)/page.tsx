'use client';

import { useRouteParams } from '@console/console/routing/useRouteParams';

import { ServiceItemContent } from '@app/_components/platform/docker/services/ItemView/ItemView';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  const routeParams = useRouteParams();
  return (
    <>
      <PageHeader
        title="Service details"
        breadcrumbs={[
          { label: 'Services', link: '/:endpointId/docker/services' },
          routeParams.id,
        ]}
        reload
      />
      <ServiceItemContent />
    </>
  );
}
