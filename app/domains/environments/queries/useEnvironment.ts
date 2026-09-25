import { useQuery } from '@tanstack/react-query';

import { withError } from '@/core/query';

import type { Environment, EnvironmentId } from '../types';
import { getEnvironment } from '../services/environments.service';

import { environmentQueryKeys } from './query-keys';

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
