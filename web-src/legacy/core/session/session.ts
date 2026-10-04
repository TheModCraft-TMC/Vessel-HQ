import {
  authenticateUser,
  currentUserInspect,
  logout as logoutRequest,
  validateOAuth,
} from '@api/sdk.gen';

import { stopRealtimeQuerySync } from '@/core/realtime/query-sync';
import { clearAppState } from '@/core/composition/auth';
import type { AuthenticatedPrincipal, Credentials } from '@/domains/auth';

import { toAuthenticatedPrincipal, toAuthCredentials } from './mappers';
import { authStorage } from './storage';

let sessionUser: AuthenticatedPrincipal | undefined;

export async function restoreSession() {
  try {
    const response = await currentUserInspect();
    sessionUser = toAuthenticatedPrincipal(response.data);
    authStorage.setUserId(sessionUser.Id);
    return sessionUser;
  } catch {
    stopRealtimeQuerySync();
    sessionUser = undefined;
    return undefined;
  }
}

export async function initializeAuthentication() {
  return Boolean(await restoreSession());
}

export async function login(credentials: Credentials) {
  await authenticateUser({
    body: toAuthCredentials(credentials),
  });
  const user = await restoreSession();
  if (!user) {
    throw new Error(
      'Authentication succeeded but the user could not be loaded'
    );
  }
  return user;
}

export async function loginWithOAuth(code: string) {
  await validateOAuth({ body: { Code: code } });
  const user = await restoreSession();
  if (!user) {
    throw new Error('OAuth succeeded but the user could not be loaded');
  }
  return user;
}

export async function logout() {
  try {
    await logoutRequest();
  } finally {
    stopRealtimeQuerySync();
    sessionUser = undefined;
    clearAppState();
    authStorage.clear();
  }
}

export function getSessionUser() {
  return sessionUser;
}

export const getAuthenticatedUser = getSessionUser;

export function isAuthenticated() {
  return Boolean(sessionUser?.Id);
}

export function isAdministrator() {
  return sessionUser?.Role === 1;
}

export function isEdgeAdministrator() {
  return sessionUser?.Role === 1 || (sessionUser?.Role as number) === 3;
}
