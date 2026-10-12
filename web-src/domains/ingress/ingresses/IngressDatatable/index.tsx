import { PageHeader } from '@/ui/layouts/view-layout/page-header';

import { IngressDatatable } from './IngressDatatable';

export function IngressesDatatableView() {
  return (
    <>
      <PageHeader
        title="Ingress list"
        breadcrumbs={[
          {
            label: 'Ingresses',
          },
        ]}
        reload
      />
      <IngressDatatable />
    </>
  );
}
