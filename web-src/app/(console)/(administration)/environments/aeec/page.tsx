import { EdgeAutoCreateContent } from '@console/console/pages/EdgeAutoCreatePage';

import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader
        title="Automatic Edge Environment Creation"
        breadcrumbs={[
          { label: 'Environments', link: '/environments' },
          'Automatic Edge Environment Creation',
        ]}
        reload
      />
      <EdgeAutoCreateContent />
    </>
  );
}
