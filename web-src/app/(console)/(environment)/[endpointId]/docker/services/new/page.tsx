'use client';

import { DockerServiceCreateContent } from '@console/console/platform/docker/DockerServiceStackPages';

import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader
        title="Create service"
        breadcrumbs={[
          { label: 'Services', link: '/:endpointId/docker/services' },
          'Add service',
        ]}
      />
      <DockerServiceCreateContent />
    </>
  );
}
