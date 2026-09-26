import { prepareOAuthLogin } from './oauth';

describe('prepareOAuthLogin', () => {
  it('adds state without overwriting existing authorization parameters', () => {
    const result = prepareOAuthLogin({
      authorizationUri:
        'https://identity.example/authorize?client_id=vessel&prompt=login',
      currentUrl: 'https://vessel.example/#/auth',
      storedState: '',
      createState: () => 'new-state',
    });

    expect(result.kind).toBe('login');
    if (result.kind !== 'login') return;

    const loginUrl = new URL(result.loginUri);
    expect(loginUrl.searchParams.get('client_id')).toBe('vessel');
    expect(loginUrl.searchParams.get('prompt')).toBe('login');
    expect(loginUrl.searchParams.get('state')).toBe('new-state');
  });

  it('validates a callback before generating a replacement state', () => {
    const createState = vi.fn(() => 'replacement-state');

    const result = prepareOAuthLogin({
      authorizationUri: 'https://identity.example/authorize?client_id=vessel',
      currentUrl:
        'https://vessel.example/?code=authorization-code&state=expected-state#/auth',
      storedState: 'expected-state',
      createState,
    });

    expect(result).toEqual({ kind: 'callback', code: 'authorization-code' });
    expect(createState).not.toHaveBeenCalled();
  });

  it('reads callback parameters from a hash route', () => {
    const result = prepareOAuthLogin({
      authorizationUri: 'https://identity.example/authorize?client_id=vessel',
      currentUrl:
        'https://vessel.example/#/auth?code=authorization-code&state=expected-state',
      storedState: 'expected-state',
      createState: () => 'replacement-state',
    });

    expect(result).toEqual({ kind: 'callback', code: 'authorization-code' });
  });

  it('rejects a callback with a mismatched state', () => {
    const result = prepareOAuthLogin({
      authorizationUri: 'https://identity.example/authorize?client_id=vessel',
      currentUrl:
        'https://vessel.example/?code=authorization-code&state=unexpected-state#/auth',
      storedState: 'expected-state',
      createState: () => 'replacement-state',
    });

    expect(result).toEqual({
      kind: 'error',
      message: 'Invalid OAuth state, try again.',
    });
  });

  it('surfaces an OAuth provider error description', () => {
    const result = prepareOAuthLogin({
      authorizationUri: 'https://identity.example/authorize?client_id=vessel',
      currentUrl:
        'https://vessel.example/?error=access_denied&error_description=Login%20cancelled#/auth',
      storedState: 'expected-state',
      createState: () => 'replacement-state',
    });

    expect(result).toEqual({ kind: 'error', message: 'Login cancelled' });
  });
});
