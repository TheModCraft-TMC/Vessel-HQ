import { useRouteParams } from '@console/console/routing/useRouteParams';
import { useState } from 'react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useNodeMetricsQuery } from '@/domains/clusters/metrics/queries/useNodeMetricsQuery';
import { useNodeQuery } from '@/domains/clusters/cluster/queries/useNodeQuery';
import { parseCPU } from '@/domains/clusters/utils';
import { useAggregatedMetrics } from '@/domains/clusters/metrics/useAggregatedMetrics';
import { MetricsAboutPanel } from '@/domains/clusters/metrics/MetricsAboutPanel';
import { CpuUsageChart } from '@/domains/clusters/metrics/charts/CpuUsageChart';
import { MemoryUsageChart } from '@/domains/clusters/metrics/charts/MemoryUsageChart';
import { Alert } from '@/ui/components/feedback/Alert';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

export function NodeStatsView() {
  return (
    <>
      <PageHeader title="Node stats" breadcrumbs="Cluster" />
      <NodeStatsContent />
    </>
  );
}

export function NodeStatsContent() {
  const environmentId = useEnvironmentId();
  const { nodeName } = useRouteParams();

  const [refreshRateMS, setRefreshRateMS] = useState(30_000);

  const nodeQuery = useNodeQuery(environmentId, nodeName, {
    select: (node) => parseCPU(node.status?.allocatable?.cpu ?? '') || 1,
  });
  const nodeCPU = nodeQuery.data ?? 1;

  const metricsQuery = useNodeMetricsQuery(nodeName, environmentId, {
    select: (node) => ({
      cpu: node.usage.cpu,
      memory: node.usage.memory,
      timestamp: String(node.metadata.creationTimestamp),
    }),
    refreshRateMS,
  });

  const { chartData, metricsState } = useAggregatedMetrics(
    {
      data: metricsQuery.data,
      error: metricsQuery.isFetchedAfterMount ? metricsQuery.error : undefined,
    },
    nodeCPU,
    `portainer.node-stats.v1.${environmentId}.${encodeURIComponent(nodeName)}`
  );

  return (
    <div className="mx-4 mb-4 space-y-4">
      {metricsState === 'unavailable' && (
        <Alert color="warn" title="Unable to retrieve node metrics">
          Vessel HQ was unable to retrieve any metrics associated with that
          node. Please contact your administrator to ensure that the Kubernetes
          metrics feature is properly configured.
        </Alert>
      )}

      {metricsState === 'available' && (
        <>
          <MetricsAboutPanel
            description={
              <>
                This view displays real-time statistics about the node{' '}
                <b>{nodeName}</b>.
              </>
            }
            textClassName="text-muted"
            refreshRateMS={refreshRateMS}
            onRefreshRateChange={setRefreshRateMS}
            dataCy="node-stats-refresh-rate"
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <MemoryUsageChart
              chartData={chartData}
              icon="cpu"
              yAxisDomain={['auto', 'auto']}
            />
            <CpuUsageChart chartData={chartData} />
          </div>
        </>
      )}
    </div>
  );
}
