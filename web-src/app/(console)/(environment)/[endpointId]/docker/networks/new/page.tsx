'use client';

import { DockerNetworkCreateContent } from '@console/console/platform/docker/DockerNetworkVolumePages';

import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader
        title="Create network"
        breadcrumbs={[
          { label: 'Networks', link: '/:endpointId/docker/networks' },
          'Add network',
        ]}
      />
      <DockerNetworkCreateContent />
    </>
  );
}
