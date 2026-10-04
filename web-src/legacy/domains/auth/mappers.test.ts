import type { AuthAuthenticateResponse, PortainerUser } from '@api/types.gen';

import {
  toAuthCredentials,
  toAuthenticatedPrincipal,
  toSessionResult,
} from './mappers';

describe('auth mappers', () => {
  it('maps credentials to the generated authentication payload', () => {
    expect(
      toAuthCredentials({ username: 'admin', password: 'secret' })
    ).toEqual({ Username: 'admin', Password: 'secret' });
  });

  it('maps the generated authentication response to a session result', () => {
    const response: AuthAuthenticateResponse = { jwt: 'token' };

    expect(toSessionResult(response)).toEqual({ token: 'token' });
  });

  it('maps a current user response into a detached principal', () => {
    const response: PortainerUser & {
      EndpointAuthorizations: Record<number, Record<string, boolean>>;
      forceChangePassword: boolean;
    } = {
      Id: 7,
      Username: 'admin',
      Role: 1,
      EndpointAuthorizations: { 1: { DockerContainerList: true } },
      ThemeSettings: { color: 'dark' },
      UseCache: true,
      forceChangePassword: true,
    };

    const principal = toAuthenticatedPrincipal(response);

    expect(principal).toEqual(response);
    expect(principal).not.toBe(response);
    expect(principal.EndpointAuthorizations).not.toBe(
      response.EndpointAuthorizations
    );
    expect(principal.ThemeSettings).not.toBe(response.ThemeSettings);
  });

  it('provides domain defaults for optional current user fields', () => {
    const principal = toAuthenticatedPrincipal({
      Id: 7,
      Username: 'admin',
      Role: 1,
    });

    expect(principal).toMatchObject({
      EndpointAuthorizations: {},
      UseCache: false,
      ThemeSettings: { color: 'auto' },
    });
  });
});
