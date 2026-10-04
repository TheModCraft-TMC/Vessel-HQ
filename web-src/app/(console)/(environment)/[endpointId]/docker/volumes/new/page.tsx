'use client';

import { DockerVolumeCreateContent } from '@console/console/platform/docker/DockerNetworkVolumePages';

import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader
        title="Create volume"
        breadcrumbs={[
          { label: 'Volumes', link: '/:endpointId/docker/volumes' },
          'Add volume',
        ]}
      />
      <DockerVolumeCreateContent />
    </>
  );
}
