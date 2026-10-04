import { EnvironmentId } from '@/domains/environments';
import { queryKeys as dockerQueryKeys } from '@/react/docker/queries/utils/root';

export const queryKeys = {
  base: (environmentId: EnvironmentId) =>
    [...dockerQueryKeys.root(environmentId), 'volumes'] as const,
};
