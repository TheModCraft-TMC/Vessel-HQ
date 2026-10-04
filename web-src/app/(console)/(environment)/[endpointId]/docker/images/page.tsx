'use client';

import { DockerImagesContent } from '@console/console/platform/docker/DockerListPages';

import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader title="Image list" breadcrumbs="Images" reload />
      <DockerImagesContent />
    </>
  );
}
