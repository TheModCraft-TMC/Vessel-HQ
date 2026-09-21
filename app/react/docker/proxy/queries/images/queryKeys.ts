import { EnvironmentId } from '@/domains/environments';

import { queryKeys as proxyQueryKeys } from '../query-keys';

export const queryKeys = {
  base: (environmentId: EnvironmentId) =>
    [proxyQueryKeys.base(environmentId), 'images'] as const,
  list: (environmentId: EnvironmentId) => queryKeys.base(environmentId),
};
