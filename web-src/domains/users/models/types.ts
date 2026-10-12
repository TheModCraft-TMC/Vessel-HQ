import { EnvironmentId } from '@/domains/environments';

import { type UserId } from './user-id';

export interface AuthorizationMap {
  [authorization: string]: boolean;
}

export { type UserId };

export enum Role {
  Admin = 1,
  Standard,
  EdgeAdmin,
}

export const RoleNames: { [key in Role]: string } = {
  [Role.Admin]: 'administrator',
  [Role.Standard]: 'user',
  [Role.EdgeAdmin]: 'edge administrator',
};

export type ThemeColor = 'dark' | 'light' | 'highcontrast' | 'auto';

export type User = {
  Id: UserId;
  Username: string;
  Role: Role;
  EndpointAuthorizations: {
    [endpointId: EnvironmentId]: AuthorizationMap;
  };
  UseCache: boolean;
  ThemeSettings: {
    color: ThemeColor;
  };
};
