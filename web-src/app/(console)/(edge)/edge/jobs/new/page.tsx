import { EdgeJobCreateContent } from '@console/console/pages/EdgeEntityPages';

import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader
        title="Create edge job"
        breadcrumbs={[
          { label: 'Edge jobs', link: '/edge/jobs' },
          'Create edge job',
        ]}
      />
      <EdgeJobCreateContent />
    </>
  );
}
