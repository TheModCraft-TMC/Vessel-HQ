import { useCurrentStateAndParams } from '@uirouter/react';
import { useEffect, useState } from 'react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import {
  CpuUsageChart,
  MemoryUsageChart,
  MetricsAboutPanel,
  parseCPU,
  useAggregatedMetrics,
  useNodeQuery,
  usePodMetricsQuery,
} from '@/domains/clusters';
import MemoryIcon from '@/assets/ico/memory.svg?c';
import { Alert } from '@/ui/components/feedback/Alert';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

import { getPod } from './getPod';

export function ApplicationStatsView() {
  const environmentId = useEnvironmentId();
  const {
    params: {
      namespace,
      name: applicationName,
      pod: podName,
      container: containerName,
    },
  } = useCurrentStateAndParams();

  const [refreshRateMS, setRefreshRateMS] = useState(30_000);

  // Get pod to find which node it runs on (needed for CPU% calculation)
  const [podNodeName, setPodNodeName] = useState<string | undefined>(undefined);
  useEffect(() => {
    async function fetchPod() {
      try {
        const pod = await getPod(environmentId, namespace, podName);
        setPodNodeName(pod.spec?.nodeName ?? undefined);
      } catch {
        // pod fetch failure is non-critical; node CPU falls back to 1
      }
    }
    void fetchPod();
  }, [environmentId, namespace, podName]);

  const nodeQuery = useNodeQuery(environmentId, podNodeName ?? '', {
    enabled: !!podNodeName,
    select: (node) => parseCPU(node.status?.allocatable?.cpu ?? '') || 1,
  });
  const nodeCPU = nodeQuery.data ?? 1;

  const metricsQuery = usePodMetricsQuery(
    { environmentId, namespace, podName },
    {
      select: (pod) => {
        const container = pod.containers?.find((c) => c.name === containerName);
        if (!container || !pod.timestamp) {
          return undefined;
        }
        return {
          cpu: container.usage.cpu,
          memory: container.usage.memory,
          timestamp: pod.timestamp,
        };
      },
      refreshRateMS,
    }
  );

  const { chartData, metricsState } = useAggregatedMetrics(
    {
      data: metricsQuery.data,
      error: metricsQuery.isFetchedAfterMount ? metricsQuery.error : undefined,
    },
    nodeCPU
  );

  return (
    <>
      <PageHeader
        title="Application stats"
        breadcrumbs={[
          { label: 'Namespaces', link: 'kubernetes.resourcePools' },
          {
            label: namespace,
            link: 'kubernetes.resourcePools.resourcePool',
            linkParams: { id: namespace },
          },
          { label: 'Applications', link: 'kubernetes.applications' },
          {
            label: applicationName,
            link: 'kubernetes.applications.application',
            linkParams: { name: applicationName, namespace },
          },
          'Pods',
          podName,
          'Containers',
          containerName,
          'Stats',
        ]}
      />
      <div className="mx-4 mb-4 space-y-4">
        {metricsState === 'unavailable' && (
          <Alert color="warn" title="Unable to retrieve container metrics">
            Vessel HQ was unable to retrieve any metrics associated with that
            container. Please contact your administrator to ensure that the
            Kubernetes metrics feature is properly configured.
          </Alert>
        )}
        {metricsState === 'available' && (
          <>
            <MetricsAboutPanel
              description={
                <>
                  This view displays real-time statistics about the container{' '}
                  <b>{containerName}</b>.
                </>
              }
              textClassName="text-warning"
              refreshRateMS={refreshRateMS}
              onRefreshRateChange={setRefreshRateMS}
              dataCy="app-stats-refresh-rate"
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <MemoryUsageChart chartData={chartData} icon={MemoryIcon} />
              <CpuUsageChart chartData={chartData} />
            </div>
          </>
        )}
      </div>
    </>
  );
}
