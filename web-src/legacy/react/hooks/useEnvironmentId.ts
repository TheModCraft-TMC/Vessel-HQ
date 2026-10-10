import { useRouteParams } from '@console/console/routing/useRouteParams';

import { EnvironmentId } from '@/domains/environments';

/**
 * useEnvironmentId is a hook that returns the environmentId from the url params.
 * use only when endpointId is set in the path.
 * for example: /kubernetes/clusters/:endpointId
 * for `:id` paths, use a different hook
 */
export function useEnvironmentId(force = true): EnvironmentId {
  const { endpointId: environmentId } = useRouteParams();

  if (!environmentId) {
    if (!force) {
      return 0;
    }

    throw new Error('endpointId url param is required');
  }

  return parseInt(environmentId, 10);
}
