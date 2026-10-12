'use client';

import { useRouteParams } from '@console/routing/useRouteParams';
import { useState } from 'react';
import { PageContent } from '@console/layout/PageContent';

import {
  useContainer,
  ContainerDetailsResponse,
} from '@/domains/containers/queries/useContainer';
import { trimContainerName } from '@/domains/containers/utils';
import { useEnvironmentId } from '@/core/routing/useEnvironmentId';
import { Alert } from '@/ui/components/feedback/Alert';
import { AboutStatsPanel } from '@/domains/containers/views/ContainerStatsView/AboutStatsPanel';
import { CpuUsageChart } from '@/domains/containers/views/ContainerStatsView/charts/CpuUsageChart';
import { IoUsageChart } from '@/domains/containers/views/ContainerStatsView/charts/IoUsageChart';
import { MemoryUsageChart } from '@/domains/containers/views/ContainerStatsView/charts/MemoryUsageChart';
import { NetworkUsageChart } from '@/domains/containers/views/ContainerStatsView/charts/NetworkUsageChart';
import { ProcessesDatatable } from '@/domains/containers/views/ContainerStatsView/ProcessesDatatable';
import { useAggregatedStats } from '@/domains/containers/views/ContainerStatsView/useAggregatedStats';


export default function Page() {
  const environmentId = useEnvironmentId();
  const { id: containerId, nodeName } = useRouteParams();

  const [refreshRateMS, setRefreshRateMS] = useState(5000);

  const containerQuery = useContainer<ContainerDetailsResponse>({
    environmentId,
    containerId,
    nodeName,
  });
  const containerName = trimContainerName(containerQuery.data?.Name);

  const { chartData, networkUnavailable, ioUnavailable, error } =
    useAggregatedStats(environmentId, containerId, nodeName, refreshRateMS);

  return (
    <PageContent>
      <AboutStatsPanel
        containerName={containerName}
        refreshRateMS={refreshRateMS}
        onRefreshRateChange={setRefreshRateMS}
        networkUnavailable={networkUnavailable}
        ioUnavailable={ioUnavailable}
      />
      {Boolean(error) && (
        <Alert color="error" title="Unable to retrieve container statistics">
          {error instanceof Error
            ? error.message
            : 'Unable to retrieve container statistics'}
        </Alert>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <MemoryUsageChart chartData={chartData} />
        <CpuUsageChart chartData={chartData} />
        {!networkUnavailable && <NetworkUsageChart chartData={chartData} />}
        {!ioUnavailable && <IoUsageChart chartData={chartData} />}
      </div>
      <ProcessesDatatable flush />
    </PageContent>
  );
}
