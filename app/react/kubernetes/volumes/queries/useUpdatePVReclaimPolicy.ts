import { useMutation, useQueryClient } from '@tanstack/react-query';

import { EnvironmentId } from '@/features/environments';
import axios from '@/portainer/services/axios/axios';
import { withError } from '@/core/query/query-client';
import { notifySuccess } from '@/portainer/services/notifications';

import { ReclaimPolicy } from '../ListView/types';

import { queryKeys } from './query-keys';

interface UpdateReclaimPolicyPayload {
  name: string;
  reclaimPolicy: ReclaimPolicy;
}

export function useUpdatePVReclaimPolicy(environmentId: EnvironmentId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateReclaimPolicyPayload) =>
      updateReclaimPolicy(payload, environmentId),
    onSuccess: () => {
      notifySuccess('Success', 'Reclaim policy successfully updated');
      return queryClient.invalidateQueries(queryKeys.volumes(environmentId));
    },
    ...withError('Unable to update reclaim policy'),
  });
}

function updateReclaimPolicy(
  payload: UpdateReclaimPolicyPayload,
  environmentId: EnvironmentId
) {
  return axios.put(
    `/kubernetes/${environmentId}/persistent_volumes/reclaim_policy`,
    payload
  );
}
