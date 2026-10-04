'use client';

import { DockerStacksContent } from '@console/console/platform/docker/DockerListPages';

import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader title="Stacks list" breadcrumbs="Stacks" reload />
      <DockerStacksContent />
    </>
  );
}
