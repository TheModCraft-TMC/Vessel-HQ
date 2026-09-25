import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { withError, withInvalidate } from '@/core/query';
import { UserId } from '@/domains/users';
import { buildUrl } from '@/domains/users';
import { userQueryKeys } from '@/domains/users';

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UserId) => deleteUser(id),
    ...withError('Unable to delete user'),
    ...withInvalidate(queryClient, [userQueryKeys.base()]),
  });
}

export async function deleteUser(id: UserId) {
  try {
    await axios.delete(buildUrl(id));
  } catch (error) {
    throw parseAxiosError(error);
  }
}
