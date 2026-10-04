'use client';

import { DockerContainersContent } from '@console/console/platform/docker/DockerListPages';

import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader title="Container list" breadcrumbs="Containers" reload />
      <DockerContainersContent />
    </>
  );
}
