import { round } from 'lodash';

import { EnvironmentId } from '@/domains/environments';
import { parseCPU } from '@/domains/clusters';

import { useNamespaceQuery } from '../../../queries/useNamespaceQuery';
import { megaBytesValue } from '../../../resourceQuotaUtils';
import { PortainerNamespace } from '../../../types';

/**
 * Returns the resource quota used for a namespace.
 * @param environmentId - The environment ID.
 * @param namespaceName - The namespace name.
 * @param enabled - Whether the resource quota is enabled.
 * @returns The resource quota used for the namespace. CPU (cores) is rounded to 3 decimal places. Memory is in MB.
 */
export function useResourceQuotaUsed(
  environmentId: EnvironmentId,
  namespaceName: string,
  enabled = true
) {
  return useNamespaceQuery(environmentId, namespaceName, {
    select: parseResourceQuotaUsed,
    enabled,
    params: { withResourceQuota: 'true' },
  });
}

function parseResourceQuotaUsed(namespace: PortainerNamespace) {
  return {
    cpu: round(
      parseCPU(namespace.ResourceQuota?.status?.used?.['requests.cpu'] ?? ''),
      3
    ),
    memory: megaBytesValue(
      namespace.ResourceQuota?.status?.used?.['requests.memory'] ?? ''
    ),
  };
}
