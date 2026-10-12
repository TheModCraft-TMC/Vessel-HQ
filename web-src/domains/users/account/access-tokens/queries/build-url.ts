import { UserId } from '@/domains/users';

import { AccessToken } from '../types';

export function buildUrl(userId: UserId, id?: AccessToken['id']) {
  const baseUrl = `/users/${userId}/tokens`;
  return id ? `${baseUrl}/${id}` : baseUrl;
}
