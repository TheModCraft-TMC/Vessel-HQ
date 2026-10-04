'use client';

import { DockerNetworksContent } from '@console/console/platform/docker/DockerListPages';

import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader title="Network list" breadcrumbs="Networks" reload />
      <DockerNetworksContent />
    </>
  );
}
