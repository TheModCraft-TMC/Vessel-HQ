import { useQuery } from '@tanstack/react-query';
import { Node } from 'kubernetes-types/core/v1';
import filesizeParser from 'filesize-parser';

import { EnvironmentId } from '@/domains/environments';
import { getMetricsForAllNodes } from '@/domains/clusters/metrics/metrics';
import { withError } from '@/core/query';
import { NodeMetrics } from '@/domains/clusters/metrics/types';
import { getMebibytes, parseCPU } from '@/domains/clusters/utils';

export function useClusterResourceUsageQuery(
  environmentId: EnvironmentId,
  serverMetricsEnabled: boolean,
  authorized: boolean,
  nodes: Node[]
) {
  return useQuery(
    [environmentId, 'clusterResourceUsage'],
    () => getMetricsForAllNodes(environmentId),
    {
      enabled:
        authorized &&
        serverMetricsEnabled &&
        !!environmentId &&
        nodes.length > 0,
      select: aggregateResourceUsage,
      ...withError('Unable to retrieve resource usage data.', 'Failure'),
    }
  );
}

function aggregateResourceUsage(data: NodeMetrics) {
  return data.items.reduce(
    (total, item) => ({
      cpu: total.cpu + parseCPU(item.usage.cpu),
      // item.usage.memory is a string with a KiB unit. Get the bytes then the MiB
      memory: total.memory + getMebibytes(filesizeParser(item.usage.memory)),
    }),
    {
      cpu: 0,
      memory: 0,
    }
  );
}
