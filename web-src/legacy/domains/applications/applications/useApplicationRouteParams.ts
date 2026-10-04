import { useRouteParams } from '@console/console/routing/useRouteParams';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

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
