import { EnvironmentId } from '@/domains/environments';

import { Filters } from './types';

export const queryKeys = {
  list: (environmentId: EnvironmentId) =>
    ['docker', environmentId, 'containers'] as const,

  filters: (
    environmentId: EnvironmentId,
    params: { all?: boolean; filters?: Filters; nodeName?: string } = {}
  ) => [...queryKeys.list(environmentId), params] as const,

  container: (environmentId: EnvironmentId, id: string) =>
    [...queryKeys.list(environmentId), id] as const,

  gpus: (environmentId: EnvironmentId, id: string) =>
    [...queryKeys.container(environmentId, id), 'gpus'] as const,

  top: (environmentId: EnvironmentId, id: string) =>
    [...queryKeys.container(environmentId, id), 'top'] as const,

  stats: (environmentId: EnvironmentId, id: string) =>
    [...queryKeys.container(environmentId, id), 'stats'] as const,
};
