'use client';

import { DockerVolumesContent } from '@console/console/platform/docker/DockerListPages';

import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader title="Volume list" breadcrumbs="Volumes" reload />
      <DockerVolumesContent />
    </>
  );
}
