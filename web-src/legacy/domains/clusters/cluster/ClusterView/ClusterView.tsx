import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';
import { NodesDatatable } from '@/domains/clusters/cluster/HomeView/NodesDatatable';

import { ClusterResourceReservation } from './ClusterResourceReservation';

export function ClusterView() {
  const { data: environment } = useCurrentEnvironment();

  return (
    <>
      <PageHeader
        title="Cluster"
        breadcrumbs={[
          { label: 'Environments', link: '/environments' },
          {
            label: environment?.Name || '',
            link: '/environments/:id',
            linkParams: { id: environment?.Id },
          },
          'Cluster information',
        ]}
        reload
      />

      <ClusterResourceReservation />

      <div className="row">
        <NodesDatatable />
      </div>
    </>
  );
}
