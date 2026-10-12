import { useRouteParams } from '@console/routing/useRouteParams';

import { useEnvironmentId } from '@/core/routing/useEnvironmentId';

import type { AppKind } from './types';

export function useApplicationRouteParams() {
  const environmentId = useEnvironmentId();
  const { namespace, name, 'resource-type': resourceType } = useRouteParams();

  return {
    environmentId,
    namespace,
    name,
    resourceType: resourceType as AppKind | undefined,
  };
}
