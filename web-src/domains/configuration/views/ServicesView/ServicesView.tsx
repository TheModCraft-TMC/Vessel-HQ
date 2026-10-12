import { PageHeader } from '@/ui/layouts/view-layout/page-header';

import { ServicesDatatable } from '../ServicesDatatable';

export function ServicesView() {
  return (
    <>
      <PageHeader title="Service list" breadcrumbs="Services" reload />
      <ServicesDatatable />
    </>
  );
}
