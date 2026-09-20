import axios, { parseAxiosError } from '@/react/portainer/services/axios/axios';
import { TeamMembership } from '@/react/portainer/users/teams/types';

import { User, UserId } from './types';
import { filterNonAdministratorUsers } from './user.helpers';

export async function getUsers(
  includeAdministrators = false,
  environmentId = 0
) {
  try {
    const { data } = await axios.get<User[]>(buildUrl(), {
      params: { environmentId },
    });

    return includeAdministrators ? data : filterNonAdministratorUsers(data);
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve users');
  }
}

export async function getUserMemberships(id: UserId) {
  try {
    const { data } = await axios.get<TeamMembership[]>(
      buildUrl(id, 'memberships')
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err as Error, 'Unable to retrieve user memberships');
  }
}

export async function updateUser(
  id: UserId,
  payload: {
    username?: string;
    role?: number;
    newPassword?: string;
  }
) {
  try {
    const { data } = await axios.put<User>(buildUrl(id), payload);
    return data;
  } catch (error) {
    throw parseAxiosError(error as Error, 'Unable to update user');
  }
}

export async function deleteUser(id: UserId) {
  try {
    await axios.delete(buildUrl(id));
  } catch (error) {
    throw parseAxiosError(error as Error, 'Unable to remove user');
  }
}

export function buildUrl(id?: UserId, entity?: string) {
  let url = '/users';

  if (id) {
    url += `/${id}`;
  }

  if (entity) {
    url += `/${entity}`;
  }

  return url;
}
