import { RegistryCreateContent } from '@console/console/pages/RegistryCreatePage';

import { PageHeader } from '@/ui/layouts/view-layout';

export default function NewRegistryPage() {
  return (
    <>
      <PageHeader
        title="Create registry"
        breadcrumbs={[
          { label: 'Registries', link: '/registries' },
          'Add registry',
        ]}
      />
      <RegistryCreateContent />
    </>
  );
}
