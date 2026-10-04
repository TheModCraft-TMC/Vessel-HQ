'use client';

import { ImportImageForm } from '@/domains/images/views/ImportView/ImportView';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader
        title="Import image"
        breadcrumbs={[
          { label: 'Images', link: '/:endpointId/docker/images' },
          'Import image',
        ]}
      />
      <ImportImageForm />
    </>
  );
}
