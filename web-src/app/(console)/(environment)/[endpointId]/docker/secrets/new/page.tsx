'use client';

import { DockerSecretCreateContent } from '@console/console/platform/docker/DockerCreateResourcePages';

import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader
        title="Create secret"
        breadcrumbs={[
          { label: 'Secrets', link: '/:endpointId/docker/secrets' },
          'Add secret',
        ]}
      />
      <DockerSecretCreateContent />
    </>
  );
}
