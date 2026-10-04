'use client';

import { DockerServicesContent } from '@console/console/platform/docker/DockerListPages';

import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader title="Service list" breadcrumbs="Services" reload />
      <DockerServicesContent />
    </>
  );
}
