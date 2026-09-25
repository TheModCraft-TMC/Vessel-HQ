import { useMutation, useQueryClient } from '@tanstack/react-query';

import { EnvironmentId } from '@/domains/environments';
import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { getAllSettledItems } from '@/portainer/helpers/promise-utils';
import { withError } from '@/core/query';
import {
  notifyError,
  notifySuccess,
} from '@/ui/components/toast/notifications';
import { pluralize } from '@/portainer/helpers/strings';
import { serviceAccountQueryKeys as queryKeys } from '@/domains/kubernetes-access';
import { secretQueryKeys } from '@/domains/configuration/configs/queries/query-keys';

export type SAImagePullSecretsUpdate = {
  saName: string;
  namespace: string;
  newSecrets: string[];
};

export function useUpdateLinkedServiceAccountsMutation(
  environmentId: EnvironmentId
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: SAImagePullSecretsUpdate[]) =>
      updateLinkedServiceAccounts(updates, environmentId),
    onSuccess: async ({ fulfilledItems, rejectedItems }) => {
      rejectedItems.forEach(({ item, reason }) => {
        notifyError(
          `Failed to update service account '${item.saName}'`,
          new Error(reason)
        );
      });
      if (fulfilledItems.length) {
        notifySuccess(
          `${pluralize(fulfilledItems.length, 'Service account')} updated`,
          fulfilledItems.map((item) => item.saName).join(', ')
        );
      }
      // use await to wait for refetches before showing the mutation as complete
      await queryClient.invalidateQueries(queryKeys.base(environmentId));
      // just trigger the invalidation for secrets without waiting the refetch
      queryClient.invalidateQueries(
        secretQueryKeys.secretsForCluster(environmentId)
      );
    },
    ...withError('Unable to update linked service accounts'),
  });
}

function updateLinkedServiceAccounts(
  updates: Array<SAImagePullSecretsUpdate>,
  environmentId: EnvironmentId
) {
  return getAllSettledItems(updates, updateServiceAccount);

  async function updateServiceAccount({
    saName,
    namespace,
    newSecrets,
  }: SAImagePullSecretsUpdate) {
    try {
      await axios.put(
        `kubernetes/${environmentId}/namespaces/${namespace}/service_accounts/${saName}/image_pull_secrets`,
        { secretNames: newSecrets }
      );
    } catch (e) {
      throw parseAxiosError(e, 'Unable to update service account');
    }
  }
}
