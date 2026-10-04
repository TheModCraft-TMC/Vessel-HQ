import { EnvironmentId } from '@/domains/environments';
import { queryKeys as dockerQueryKeys } from '@/react/docker/queries/utils';

import { NetworkId } from '../models/network';

import { NetworksQuery } from './types';

export const queryKeys = {
  base: (environmentId: EnvironmentId) =>
    [...dockerQueryKeys.root(environmentId), 'networks'] as const,
  list: (environmentId: EnvironmentId, query: NetworksQuery) =>
    [...queryKeys.base(environmentId), 'list', query] as const,
  item: (environmentId: EnvironmentId, id: NetworkId) =>
    [...queryKeys.base(environmentId), id] as const,
};
