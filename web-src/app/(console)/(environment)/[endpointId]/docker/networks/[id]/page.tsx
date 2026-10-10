'use client';

import { useRouteParams } from '@console/console/routing/useRouteParams';

import { NetworkDetailsContent } from '@app/_components/platform/docker/networks/ItemView/ItemView';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  const routeParams = useRouteParams();
  return (
    <>
      <PageHeader
        title="Network details"
        breadcrumbs={[
          { label: 'Networks', link: '/:endpointId/docker/networks' },
          routeParams.id,
        ]}
        reload
      />
      <NetworkDetailsContent />
    </>
  );
}
