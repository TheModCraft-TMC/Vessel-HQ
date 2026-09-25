import { PageHeader } from '@/ui/layouts/view-layout';

import { EnvironmentRegistriesDatatable } from './EnvironmentRegistriesDatatable';

export function ListView() {
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
