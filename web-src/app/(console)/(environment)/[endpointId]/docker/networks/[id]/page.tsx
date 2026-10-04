'use client';

import { useRouteParams } from '@console/console/routing/useRouteParams';

import { NetworkDetailsContent } from '@/domains/networks/views/ItemView/ItemView';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  const params = useRouteParams();

  return (
    <>
      <PageHeader
        title="Network details"
        breadcrumbs={[
          { label: 'Networks', link: '/:endpointId/docker/networks' },
          params.id,
        ]}
        reload
      />
      <NetworkDetailsContent />
    </>
  );
}
