import { EnvironmentRegistriesDatatable } from '@/domains/registries/views/environments/ListView/EnvironmentRegistriesDatatable';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader
        title="Environment registries"
        breadcrumbs="Registry management"
        reload
      />
      <EnvironmentRegistriesDatatable />
    </>
  );
}
