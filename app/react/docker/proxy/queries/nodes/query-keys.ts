import { EnvironmentId } from '@/features/environments';

import { queryKeys as proxyQueryKeys } from '../query-keys';

export const queryKeys = {
  base: (environmentId: EnvironmentId) =>
    [...proxyQueryKeys.base(environmentId), 'nodes'] as const,
};
