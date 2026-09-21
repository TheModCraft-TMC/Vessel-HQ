import { useQuery } from '@tanstack/react-query';

import axios from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/domains/environments';

import { SinglePodMetric } from '../types';

export function usePodMetricsQuery<T = SinglePodMetric>(
  {
    environmentId,
    namespace,
    podName,
  }: {
    environmentId: EnvironmentId;
    namespace: string;
    podName: string;
  },
  {
    refreshRateMS,
    select,
  }: {
    select?: (data: SinglePodMetric) => T;
    refreshRateMS?: number;
  } = {}
) {
  return useQuery({
    queryFn: () => getMetricsForPod(environmentId, namespace, podName),
    queryKey: [environmentId, 'pod-metrics', namespace, podName],
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    select,
  });
}

async function getMetricsForPod(
  environmentId: EnvironmentId,
  namespace: string,
  podName: string
) {
  const { data: pod } = await axios.get<SinglePodMetric>(
    `kubernetes/${environmentId}/metrics/pods/namespace/${namespace}/${podName}`
  );
  return pod;
}
