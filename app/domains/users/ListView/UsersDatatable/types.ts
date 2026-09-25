import { type User } from '@/domains/users';

export type DecoratedUser = User & {
  isTeamLeader?: boolean;
  authMethod: string;
};
