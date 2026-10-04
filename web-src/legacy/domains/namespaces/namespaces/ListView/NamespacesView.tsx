import { PageHeader } from '@/ui/layouts/view-layout/page-header';

import { NamespacesDatatable } from './NamespacesDatatable';

export function NamespacesView() {
  return (
    <>
      <PageHeader title="Namespace list" breadcrumbs="Namespaces" reload />
      <NamespacesDatatable />
    </>
  );
}
