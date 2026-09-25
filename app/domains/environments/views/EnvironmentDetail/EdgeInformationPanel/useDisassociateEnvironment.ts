import { useMutation, useQueryClient } from '@tanstack/react-query';

import { withError, withInvalidate } from '@/core/query';
import { EnvironmentId } from '@/domains/environments';
import { disassociateEndpoint } from '@/react/portainer/environments/environment.service';

import { environmentQueryKeys } from '../../../queries/query-keys';

export function useDisassociateEnvironment(environmentId: EnvironmentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => disassociateEndpoint(environmentId),
    ...withError('Failed to disassociate environment'),
    ...withInvalidate(queryClient, [environmentQueryKeys.item(environmentId)]),
  });
}
