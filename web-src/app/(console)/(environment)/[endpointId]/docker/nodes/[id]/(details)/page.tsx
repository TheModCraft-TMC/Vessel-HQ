'use client';

import { NodeDetailsContent } from '@app/_components/platform/docker/host/DetailsView/DetailsView';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader title="Host overview" breadcrumbs={['Docker']} reload />
      <NodeDetailsContent />
    </>
  );
}
