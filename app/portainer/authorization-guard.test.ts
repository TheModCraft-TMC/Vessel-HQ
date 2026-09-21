import { StateDeclaration, StateService, Transition } from '@uirouter/react';

import { get, keyBuilder } from '@/react/hooks/useLocalStorage';
import { hasAuthorizations } from '@/react/hooks/useUser';
import {
  getAuthenticatedUser,
  initializeAuthentication,
  isAdministrator,
  isEdgeAdministrator,
} from '@/domains/auth';
import { suppressConsoleLogs } from '@/setup-tests/suppress-console';

import { checkAuthorizations } from './authorization-guard';

vi.mock('@/domains/auth', () => ({
  getAuthenticatedUser: vi.fn(),
  initializeAuthentication: vi.fn(),
  isAdministrator: vi.fn(),
  isEdgeAdministrator: vi.fn(),
}));

vi.mock('@/react/hooks/useUser', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/react/hooks/useUser')>()),
  hasAuthorizations: vi.fn(),
}));

vi.mock('@/core/realtime/query-sync', () => ({
  startRealtimeQuerySync: vi.fn(),
}));

let restoreConsole: () => void;
beforeEach(() => {
  restoreConsole = suppressConsoleLogs();
});
afterEach(() => {
  restoreConsole();
});

describe('checkAuthorizations', () => {
  let transition: Transition;
  const stateTo: StateDeclaration = {
    data: {
      access: 'restricted',
    },
  };
  const $state = {
    target: vi.fn((t) => t),
  } as unknown as StateService;

  beforeEach(() => {
    transition = {
      to: vi.fn().mockReturnValue(stateTo),
      params: vi.fn().mockReturnValue({}),
      router: {
        stateService: $state,
      } as Transition['router'],
    } as unknown as Transition;

    stateTo.data.access = 'restricted';
    localStorage.removeItem(keyBuilder('RETURN_URL'));
    vi.mocked(initializeAuthentication).mockResolvedValue(false);
    vi.mocked(getAuthenticatedUser).mockReturnValue(undefined);
    vi.mocked(isAdministrator).mockReturnValue(false);
    vi.mocked(isEdgeAdministrator).mockReturnValue(false);
    vi.mocked(hasAuthorizations).mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return undefined if access is not defined', async () => {
    stateTo.data.access = undefined;
    const result = await checkAuthorizations(transition);

    expect(result).toBeUndefined();
  });

  it('should return undefined if user is not authenticated and route access is defined', async () => {
    stateTo.data.access = 'something';
    vi.mocked(initializeAuthentication).mockResolvedValue(false);

    const result = await checkAuthorizations(transition);
    expect(result).toBeUndefined();
  });

  it('should return logout if access is "restricted"', async () => {
    const result = await checkAuthorizations(transition);

    expect(result).toBeDefined();
    expect($state.target).toHaveBeenCalledWith('portainer.logout');
  });

  it('should store the current URL in localStorage when the user is not authenticated', async () => {
    vi.mocked(initializeAuthentication).mockResolvedValue(false);

    await checkAuthorizations(transition);

    expect(get('RETURN_URL', null)).toBe(
      window.location.pathname + window.location.search + window.location.hash
    );
  });

  it('should not store a returnUrl when the user is authenticated', async () => {
    vi.mocked(initializeAuthentication).mockResolvedValue(true);

    await checkAuthorizations(transition);

    expect(get('RETURN_URL', null)).toBeNull();
  });

  it('should return undefined if user is an admin and access is "admin"', async () => {
    vi.mocked(initializeAuthentication).mockResolvedValue(true);
    vi.mocked(isAdministrator).mockReturnValue(true);
    stateTo.data.access = 'admin';

    const result = await checkAuthorizations(transition);

    expect(result).toBeUndefined();
  });

  it('should return undefined if user is an admin and access is "edge-admin"', async () => {
    vi.mocked(initializeAuthentication).mockResolvedValue(true);
    vi.mocked(isEdgeAdministrator).mockReturnValue(true);
    stateTo.data.access = 'edge-admin';

    const result = await checkAuthorizations(transition);

    expect(result).toBeUndefined();
  });

  it('should return undefined if user has the required authorizations', async () => {
    vi.mocked(initializeAuthentication).mockResolvedValue(true);
    vi.mocked(getAuthenticatedUser).mockReturnValue({ Id: 1 } as never);
    vi.mocked(hasAuthorizations).mockReturnValue(true);
    stateTo.data.access = ['permission1', 'permission2'];

    const result = await checkAuthorizations(transition);

    expect(result).toBeUndefined();
  });

  it('should redirect to home if user does not have the required authorizations', async () => {
    vi.mocked(initializeAuthentication).mockResolvedValue(true);
    vi.mocked(getAuthenticatedUser).mockReturnValue({ Id: 1 } as never);
    vi.mocked(hasAuthorizations).mockReturnValue(false);
    stateTo.data.access = ['permission1', 'permission2'];

    const result = await checkAuthorizations(transition);

    expect(result).toBeDefined();
    expect($state.target).toHaveBeenCalledWith('portainer.home');
  });
});
