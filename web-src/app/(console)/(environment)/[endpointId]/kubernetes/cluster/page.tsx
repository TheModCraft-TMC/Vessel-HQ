'use client';

import { ClusterPageHeader } from '@app/_components/platform/kubernetes/KubernetesClusterPages';
import { ClusterResourceReservation } from '@/domains/clusters/cluster/ClusterView/ClusterResourceReservation';
import { NodesDatatable } from '@/domains/clusters/cluster/HomeView/NodesDatatable';
import { useCurrentEnvironment } from '@/core/composition/useCurrentEnvironment';

export default function Page() {
  const { data: environment } = useCurrentEnvironment();

  return (
    <>
      <ClusterPageHeader
        environment={environment}
        suffix="Cluster information"
        title="Cluster"
      />
      <ClusterResourceReservation />
      <div className="row">
        <NodesDatatable />
      </div>
    </>
  );
}
