import { EnvironmentId } from '@/domains/environments';
import { queryKeys as dockerQueryKeys } from '@/core/docker/queries/utils';

export const queryKeys = {
  list: (environmentId: EnvironmentId) =>
    [dockerQueryKeys.root(environmentId), 'tasks'] as const,

  task: (environmentId: EnvironmentId, id: string) =>
    [...queryKeys.list(environmentId), id] as const,
};
