'use client';

import { ConfigsDatatable } from '@/domains/services/configs/ListView/ConfigsDatatable/ConfigsDatatable';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader title="Configs list" breadcrumbs="Configs" reload />
      <ConfigsDatatable />
    </>
  );
}
