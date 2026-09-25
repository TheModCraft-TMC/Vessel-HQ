import { EnvironmentId } from '@/domains/environments';
import { namespaceQueryKeys } from '@/domains/namespaces';
import { queryKeys as nodeQueryKeys } from '@/domains/clusters/cluster/queries/query-keys';

export const queryKeys = {
  namespaceMetrics: (environmentId: EnvironmentId, namespaceName: string) => [
    ...namespaceQueryKeys.namespace(environmentId, namespaceName),
    'metrics',
  ],
  nodeMetrics: (environmentId: EnvironmentId, nodeName: string) => [
    ...nodeQueryKeys.node(environmentId, nodeName),
    'metrics',
  ],
  applicationMetrics: (environmentId: EnvironmentId, nodeName?: string) => [
    environmentId,
    'kubernetes',
    'metrics',
    'applications',
    nodeName,
  ],
};
