'use client';

import { useRouteParams } from '@console/routing/useRouteParams';

import { StackDetailsContent } from '@/domains/stacks/views/ItemView/ItemView';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  const { name } = useRouteParams();
  return (
    <>
      <PageHeader
        title="Stack details"
        breadcrumbs={[
          { label: 'Stacks', link: '/:endpointId/docker/stacks' },
          name || '',
        ]}
      />
      <StackDetailsContent />
    </>
  );
}
