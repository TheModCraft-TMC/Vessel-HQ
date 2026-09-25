import { PageHeader } from '@/ui/layouts/view-layout';

import { ConfigsDatatable } from './ConfigsDatatable/ConfigsDatatable';

export function ListView() {
  return (
    <>
      <PageHeader title="Configs list" breadcrumbs="Configs" reload />

      <ConfigsDatatable />
    </>
  );
}
