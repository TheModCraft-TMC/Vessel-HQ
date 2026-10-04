'use client';

import { ServicesDatatable } from '@/domains/configuration/views/ServicesDatatable';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

export default function Page() {
  return (
    <>
      <PageHeader title="Service list" breadcrumbs="Services" reload />
      <ServicesDatatable />
    </>
  );
}
