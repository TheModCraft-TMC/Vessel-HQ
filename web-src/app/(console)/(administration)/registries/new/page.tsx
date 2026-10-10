import { RegistryCreateContent } from '@app/_components/pages/RegistryCreatePage';
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
