'use client';

import { DockerConfigCreateContent } from '@console/console/platform/docker/DockerCreateResourcePages';

import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader
        title="Create config"
        breadcrumbs={[
          { label: 'Configs', link: '/:endpointId/docker/configs' },
          'Add config',
        ]}
      />
      <DockerConfigCreateContent />
    </>
  );
}
