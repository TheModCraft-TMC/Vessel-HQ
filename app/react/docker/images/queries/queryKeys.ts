import { EnvironmentId } from '@/features/environments';

import { queryKeys as dockerQueryKeys } from '../../queries/utils';

export const queryKeys = {
  base: (environmentId: EnvironmentId) =>
    [...dockerQueryKeys.root(environmentId), 'images'] as const,
  list: (environmentId: EnvironmentId, options: { withUsage?: boolean } = {}) =>
    [...queryKeys.base(environmentId), options] as const,
};
