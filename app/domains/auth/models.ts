import type { PortainerUserRole } from '@api/types.gen';

import type { User } from '@/domains/users';

export interface Credentials {
  username: string;
  password: string;
}

export interface AuthenticatedPrincipal extends Omit<User, 'Role'> {
  Role: PortainerUserRole;
  forceChangePassword?: boolean;
}

export interface SessionResult {
  token?: string;
}
