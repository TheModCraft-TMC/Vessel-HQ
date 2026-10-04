'use client';

import { CreateContainerForm } from '@/domains/containers/views/ContainerCreateView/CreateView';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader
        title="Create container"
        breadcrumbs={[
          { label: 'Containers', link: '/:endpointId/docker/containers' },
          'Add container',
        ]}
        reload
      />
      <CreateContainerForm />
    </>
  );
}
