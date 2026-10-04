'use client';

import { useRouteParams } from '@console/console/routing/useRouteParams';

import { NodeStatsContent } from '@/domains/clusters/cluster/NodeStatsView/NodeStatsView';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

export default function Page() {
  const params = useRouteParams();

  return (
    <>
      <PageHeader
        title="Node stats"
        breadcrumbs={[
          { label: 'Cluster', link: '/:endpointId/kubernetes/cluster' },
          {
            label: params.nodeName,
            link: '/:endpointId/kubernetes/cluster/:nodeName',
            linkParams: { nodeName: params.nodeName },
          },
          'Stats',
        ]}
      />
      <NodeStatsContent />
    </>
  );
}
