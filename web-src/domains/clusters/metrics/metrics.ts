import axios, { parseAxiosError } from '@/shared/http';
import { EnvironmentId } from '@/domains/environments';

import { NodeMetrics } from './types';

export async function getMetricsForAllNodes(environmentId: EnvironmentId) {
  try {
    const { data: nodes } = await axios.get<NodeMetrics>(
      `kubernetes/${environmentId}/metrics/nodes`
    );
    return nodes;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to retrieve metrics for all nodes');
  }
}
