import type { Team } from '@/domains/teams';
import type { User } from '@/domains/users';

type AccessRole = { Id: number; Name: string };

class AccessViewModel {
  Inherited = false;

  Override = false;

  Role: AccessRole = { Id: 0, Name: '-' };
}

export class UserAccessViewModel extends AccessViewModel {
  Id: User['Id'];

  Name: string;

  readonly Type = 'user' as const;

  constructor(data: Pick<User, 'Id' | 'Username'>) {
    super();
    this.Id = data.Id;
    this.Name = data.Username;
  }
}

export class TeamAccessViewModel extends AccessViewModel {
  Id: Team['Id'];

  Name: string;

  readonly Type = 'team' as const;

  constructor(data: Pick<Team, 'Id' | 'Name'>) {
    super();
    this.Id = data.Id;
    this.Name = data.Name;
  }
}
