'use client';

import { PageContent } from '@console/layout/PageContent';

import { BuildImageForm } from '@/domains/images/views/BuildView/BuildView';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader
        title="Build image"
        breadcrumbs={[
          { label: 'Images', link: '/:endpointId/docker/images' },
          'Build image',
        ]}
      />
      <PageContent>
        <BuildImageForm />
      </PageContent>
    </>
  );
}
