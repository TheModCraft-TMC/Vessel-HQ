import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getPublicSettings, storeReturnUrl } from '@/core/auth';
import {
  authStorage,
  initializeAuthentication,
  logout,
  prepareOAuthLogin,
} from '@/domains/auth';

import { useLoginController } from './useLoginController';

vi.mock('next/navigation', () => ({
  usePathname: () => '/login',
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/core/auth', () => ({
  getAppState: () => ({ application: { logo: '/logo.svg' } }),
  getPublicSettings: vi.fn(),
  isValidReturnUrl: () => true,
  notifyError: vi.fn(),
  storeReturnUrl: vi.fn(),
}));

vi.mock('@/core/query', () => ({
  clearQueryCache: vi.fn(),
  queryClient: {},
}));

vi.mock('@/domains/auth', () => ({
  administratorExists: vi.fn().mockResolvedValue(true),
  authStorage: {
    getLoginState: () => '',
    setLoginState: vi.fn(),
    getLogoutReason: () =>
      sessionStorage.getItem('test-logout-reason') ?? '',
    setLogoutReason: (reason: string) =>
      sessionStorage.setItem('test-logout-reason', reason),
    clearLogoutReason: () => sessionStorage.removeItem('test-logout-reason'),
  },
  initializeAuthentication: vi.fn().mockResolvedValue(false),
  isAuthenticated: () => false,
  logout: vi.fn().mockResolvedValue(undefined),
  prepareOAuthLogin: vi.fn(),
}));

describe('login logout and error links', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    vi.mocked(getPublicSettings).mockResolvedValue({
      AuthenticationMethod: 1,
      OAuthLoginURI: '',
    } as Awaited<ReturnType<typeof getPublicSettings>>);
  });

  it.each([
    ['/login?logout&returnTo=%2Fhome', ''],
    ['/login?error=Session%20expired&returnTo=%2Fhome', 'Session expired'],
  ])('consumes %s and leaves the login form usable', async (url, reason) => {
    window.history.replaceState(null, '', url);

    const { result } = renderHook(useLoginController);

    await waitFor(() =>
      expect(result.current.formProps.loginInProgress).toBe(false)
    );
    expect(window.location.pathname).toBe('/login');
    expect(window.location.search).toBe('');
    expect(logout).toHaveBeenCalledOnce();
    expect(initializeAuthentication).not.toHaveBeenCalled();
    expect(storeReturnUrl).toHaveBeenCalledWith('/home');
    expect(result.current.formProps.authenticationError).toBe(reason);
  });

  it('creates a fresh OAuth login state after clearing the session', async () => {
    window.history.replaceState(null, '', '/login?logout');
    const authorizationUri = 'https://identity.example/authorize';
    vi.mocked(getPublicSettings).mockResolvedValue({
      AuthenticationMethod: 3,
      OAuthLoginURI: authorizationUri,
    } as Awaited<ReturnType<typeof getPublicSettings>>);
    vi.mocked(prepareOAuthLogin).mockReturnValue({
      kind: 'login',
      loginUri: `${authorizationUri}?state=new-state`,
      state: 'new-state',
    });

    const { result } = renderHook(useLoginController);

    await waitFor(() =>
      expect(result.current.formProps.loginInProgress).toBe(false)
    );
    expect(logout).toHaveBeenCalledBefore(vi.mocked(authStorage.setLoginState));
    expect(authStorage.setLoginState).toHaveBeenCalledWith('new-state');
    expect(initializeAuthentication).not.toHaveBeenCalled();
    expect(result.current.formProps.oAuthLoginUri).toBe(
      `${authorizationUri}?state=new-state`
    );
  });
});
