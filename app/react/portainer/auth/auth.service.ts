import {
  authenticateUser,
  logout as logoutRequest,
  userAdminCheck,
  validateOAuth,
} from '@api/sdk.gen';

import { isAxiosError } from '@/react/portainer/services/axios/utils/isAxiosError';
import { applyTheme } from '@/react/portainer/services/applyTheme';
import {
  CurrentUserResponse,
  getCurrentUser,
} from '@/portainer/users/queries/useLoadCurrentUser';
import { isEdgeAdmin, isPureAdmin } from '@/portainer/users/user.helpers';
import { stopRealtimeQuerySync } from '@/react-tools/realtime-query-sync';

import { clearAppState } from '../app-state';
import { authStorage } from '../storage';

let currentUser: CurrentUserResponse | undefined;

export async function initializeAuthentication() {
  try {
    currentUser = await getCurrentUser();
    authStorage.setUserId(currentUser.Id);
    applyTheme(currentUser.ThemeSettings?.color || 'auto');
    return true;
  } catch {
    stopRealtimeQuerySync();
    currentUser = undefined;
    return false;
  }
}

export async function login(username: string, password: string) {
  await authenticateUser({
    body: { Username: username, Password: password },
  });
  if (!(await initializeAuthentication())) {
    throw new Error('Authentication succeeded but the user could not be loaded');
  }
}

export async function loginWithOAuth(code: string) {
  await validateOAuth({ body: { Code: code } });
  if (!(await initializeAuthentication())) {
    throw new Error('OAuth succeeded but the user could not be loaded');
  }
}

export async function logout() {
  try {
    await logoutRequest();
  } finally {
    stopRealtimeQuerySync();
    currentUser = undefined;
    clearAppState();
    authStorage.clear();
  }
}

export function getAuthenticatedUser() {
  return currentUser;
}

export function isAuthenticated() {
  return Boolean(currentUser?.Id);
}

export function isAdministrator() {
  return currentUser ? isPureAdmin(currentUser) : false;
}

export function isEdgeAdministrator() {
  return currentUser ? isEdgeAdmin(currentUser, undefined) : false;
}

export async function administratorExists() {
  try {
    await userAdminCheck();
    return true;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return false;
    }
    throw error;
  }
}
