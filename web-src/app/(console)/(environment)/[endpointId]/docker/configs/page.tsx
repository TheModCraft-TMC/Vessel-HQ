'use client';

import { DockerConfigsContent } from '@console/console/platform/docker/DockerListPages';

import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader title="Configs list" breadcrumbs="Configs" reload />
      <DockerConfigsContent />
    </>
  );
}
