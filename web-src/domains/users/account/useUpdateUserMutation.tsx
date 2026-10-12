import { useMutation } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/shared/http';
import { ThemeColor } from '@/domains/users';
import { mutationOptions, withInvalidate, queryClient } from '@/core/query';
import { userQueryKeys } from '@/domains/users';
import { useCurrentUser } from '@/core/session/useUser';

export type UserUpdatePayload = {
  username?: string;
  password?: string;
  newPassword?: string;
  useCache?: boolean;
  theme?: { color: ThemeColor };
  role?: number;
};

export function useUpdateUserMutation() {
  const {
    user: { Id: userId },
  } = useCurrentUser();

  return useMutation(
    (payload: UserUpdatePayload) => updateUser(payload, userId),
    mutationOptions(withInvalidate(queryClient, [userQueryKeys.base()]))
    // error notification should be handled by the caller
  );
}

async function updateUser(payload: UserUpdatePayload, userId: number) {
  try {
    const { data } = await axios.put(`/users/${userId}`, payload);
    return data;
  } catch (error) {
    throw parseAxiosError(error);
  }
}
