'use client';

import { NodeDetailsContent } from '@/react/docker/host/DetailsView/DetailsView';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader title="Host overview" breadcrumbs={['Docker']} reload />
      <NodeDetailsContent />
    </>
  );
}
