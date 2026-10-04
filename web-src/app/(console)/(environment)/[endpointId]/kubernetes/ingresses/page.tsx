'use client';

import { IngressDatatable } from '@/domains/ingress/ingresses/IngressDatatable/IngressDatatable';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

export default function Page() {
  return (
    <>
      <PageHeader title="Ingress list" breadcrumbs="Ingresses" reload />
      <IngressDatatable />
    </>
  );
}
