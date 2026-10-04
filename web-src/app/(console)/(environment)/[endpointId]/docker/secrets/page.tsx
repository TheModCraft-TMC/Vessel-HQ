'use client';

import { DockerSecretsContent } from '@console/console/platform/docker/DockerListPages';

import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader title="Secrets list" breadcrumbs="Secrets" reload />
      <DockerSecretsContent />
    </>
  );
}
