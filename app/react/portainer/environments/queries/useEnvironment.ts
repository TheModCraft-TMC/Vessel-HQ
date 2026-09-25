import { useQuery } from '@tanstack/react-query';

import { withError } from '@/core/query';
import { EnvironmentId } from '@/domains/environments';

export { useEnvironment } from '@/domains/environments/queries/useEnvironment';

import { getDeploymentOptions } from '../environment.service';

import { environmentQueryKeys } from './query-keys';

export function useEnvironmentDeploymentOptions(id: EnvironmentId | undefined) {
  return useQuery(
    [...environmentQueryKeys.item(id!), 'deploymentOptions'],
    () => getDeploymentOptions(id!),
    {
      enabled: !!id,
      ...withError('Failed loading deployment options'),
    }
  );
}
