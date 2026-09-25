import type { AuthAuthenticateResponse, PortainerUser } from '@api/types.gen';

import type {
  Credentials,
  AuthenticatedPrincipal,
  SessionResult,
} from '@/domains/auth';

type CurrentUserResponse = Omit<PortainerUser, 'Role'> & {
  Role: number;
  EndpointAuthorizations?: Record<number, Record<string, boolean>>;
  forceChangePassword?: boolean;
};

export function toAuthCredentials(credentials: Credentials) {
  return {
    Username: credentials.username,
    Password: credentials.password,
  };
}

export function toSessionResult(
  response: AuthAuthenticateResponse
): SessionResult {
  return { token: response.jwt };
}

export function toAuthenticatedPrincipal(
  response: CurrentUserResponse
): AuthenticatedPrincipal {
  return {
    Id: response.Id,
    Username: response.Username,
    Role: response.Role as PortainerUser['Role'],
    EndpointAuthorizations: { ...response.EndpointAuthorizations },
    UseCache: response.UseCache ?? false,
    ThemeSettings: {
      color: response.ThemeSettings?.color || 'auto',
    },
    forceChangePassword: response.forceChangePassword,
  };
}
