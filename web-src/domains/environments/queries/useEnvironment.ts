import { useQuery } from '@tanstack/react-query';

import { withError } from '@/core/query';
import { environmentQueryKeys } from '@/domains/environments/queries/query-keys';
import { getEnvironment } from '@/domains/environments/services/environments.service';
import type {
  Environment,
  EnvironmentId,
} from '@/domains/environments/types';

export function useEnvironment<T = Environment>(
  environmentId?: EnvironmentId,
  select?: (environment: Environment) => T,
  options?: { autoRefreshRate?: number; excludeSnapshot?: boolean }
) {
  return useQuery(
    environmentQueryKeys.item(environmentId!),
    () => getEnvironment(environmentId!, options?.excludeSnapshot ?? true),
    {
      select,
      ...withError('Failed loading environment'),
      staleTime: 50,
      enabled: !!environmentId,
    }
  );
}
