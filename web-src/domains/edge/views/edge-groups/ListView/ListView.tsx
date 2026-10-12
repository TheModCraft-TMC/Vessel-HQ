import { PageHeader } from '@/ui/layouts/view-layout';

import { EdgeGroupsDatatable } from './EdgeGroupsDatatable';

export function ListView() {
  return (
    <>
      <PageHeader title="Edge Groups" breadcrumbs="Edge Groups" reload />
      <EdgeGroupsDatatable />
    </>
  );
}
