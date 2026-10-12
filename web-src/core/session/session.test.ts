import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthenticatedPrincipal } from '@/domains/auth';

import {
  getSessionUser,
  isAuthenticated,
  login,
  loginWithOAuth,
  logout,
  restoreSession,
} from './session';

const currentUserInspect = vi.hoisted(() => vi.fn());
const authenticateUser = vi.hoisted(() => vi.fn());
const validateOAuth = vi.hoisted(() => vi.fn());
const logoutRequest = vi.hoisted(() => vi.fn());
const stopRealtimeQuerySync = vi.hoisted(() => vi.fn());
const clearAppState = vi.hoisted(() => vi.fn());

vi.mock('@/core/composition/auth', () => ({
  clearAppState,
}));
vi.mock('@api/sdk.gen', () => ({
  authenticateUser,
  currentUserInspect,
  logout: logoutRequest,
  validateOAuth,
}));
vi.mock('@/core/realtime/query-sync', () => ({
  stopRealtimeQuerySync,
}));
const user: AuthenticatedPrincipal = {
  Id: 7,
  Username: 'admin',
  Role: 1,
  EndpointAuthorizations: {},
  UseCache: false,
  ThemeSettings: { color: 'auto' },
};

describe('session lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    void logoutRequest.mockResolvedValue(undefined);
  });

  it('restores and stores the authenticated principal', async () => {
    currentUserInspect.mockResolvedValue({ data: { ...user } });

    await expect(restoreSession()).resolves.toEqual(user);
    expect(getSessionUser()).toEqual(user);
    expect(isAuthenticated()).toBe(true);
    expect(localStorage.getItem('portainer.USER_ID')).toBe('7');
  });

  it('clears the in-memory session and stops realtime on restore failure', async () => {
    currentUserInspect.mockRejectedValue(new Error('unauthorized'));

    await expect(restoreSession()).resolves.toBeUndefined();
    expect(getSessionUser()).toBeUndefined();
    expect(isAuthenticated()).toBe(false);
    expect(stopRealtimeQuerySync).toHaveBeenCalled();
  });

  it('always clears session state when logging out', async () => {
    currentUserInspect.mockResolvedValue({ data: { ...user } });
    await restoreSession();

    await logout();

    expect(logoutRequest).toHaveBeenCalled();
    expect(stopRealtimeQuerySync).toHaveBeenCalled();
    expect(clearAppState).toHaveBeenCalled();
    expect(getSessionUser()).toBeUndefined();
    expect(isAuthenticated()).toBe(false);
  });

  it('loads the principal after authenticating credentials', async () => {
    authenticateUser.mockResolvedValue(undefined);
    currentUserInspect.mockResolvedValue({ data: { ...user } });

    await login({ username: 'admin', password: 'secret' });

    expect(authenticateUser).toHaveBeenCalledWith({
      body: { Username: 'admin', Password: 'secret' },
    });
    expect(getSessionUser()).toEqual(user);
  });

  it('loads the principal after OAuth authentication', async () => {
    validateOAuth.mockResolvedValue(undefined);
    currentUserInspect.mockResolvedValue({ data: { ...user } });

    await expect(loginWithOAuth('oauth-code')).resolves.toEqual(user);

    expect(validateOAuth).toHaveBeenCalledWith({
      body: { Code: 'oauth-code' },
    });
    expect(getSessionUser()).toEqual(user);
  });
});
