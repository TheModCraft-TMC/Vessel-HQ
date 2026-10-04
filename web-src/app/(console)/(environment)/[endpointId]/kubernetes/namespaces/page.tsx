'use client';

import { NamespacesDatatable } from '@/domains/namespaces/namespaces/ListView/NamespacesDatatable';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

export default function Page() {
  return (
    <>
      <PageHeader title="Namespace list" breadcrumbs="Namespaces" reload />
      <NamespacesDatatable />
    </>
  );
}
