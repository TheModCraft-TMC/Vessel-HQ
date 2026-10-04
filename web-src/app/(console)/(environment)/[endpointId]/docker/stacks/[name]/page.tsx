'use client';

import { useRouteParams } from '@console/console/routing/useRouteParams';

import { StackDetailsContent } from '@/domains/stacks/views/ItemView/ItemView';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  const params = useRouteParams();

  return (
    <>
      <PageHeader
        title="Stack details"
        breadcrumbs={[
          { label: 'Stacks', link: '/:endpointId/docker/stacks' },
          params.name,
        ]}
      />
      <StackDetailsContent />
    </>
  );
}
