import { useMutation } from '@tanstack/react-query';

import { promiseSequence } from '@/shared/promise-utils';
import { withError } from '@/core/query';
import { forceUpdateService } from '@/core/environment-management/environments/environment.service';
import { EnvironmentId } from '@/domains/environments';

export function useForceUpdateServicesMutation(environmentId: EnvironmentId) {
  return useMutation(
    ({ ids, pullImage }: { ids: Array<string>; pullImage: boolean }) =>
      promiseSequence(
        ids.map((id) => () => forceUpdateService(environmentId, id, pullImage))
      ),
    withError('Failed to remove services')
  );
}
