'use client';

import { useRouteParams } from '@console/console/routing/useRouteParams';

import { NodeDetailsContent } from '@/domains/clusters/cluster/NodeView/NodeView';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

export default function Page() {
  const params = useRouteParams();

  return (
    <>
      <PageHeader
        title="Node details"
        breadcrumbs={[
          { label: 'Cluster', link: '/:endpointId/kubernetes/cluster' },
          params.nodeName,
        ]}
        reload
      />
      <NodeDetailsContent />
    </>
  );
}
