import { Role, type User } from './types';

type ThemeSettings = User['ThemeSettings'] & {
  subtleUpgradeButton?: boolean;
};

type UserViewModelData = Partial<Omit<UserViewModel, 'RoleName' | 'Checked'>>;

export class UserViewModel implements User {
  Id = 0;

  Username = '';

  Role = Role.Standard;

  ThemeSettings: ThemeSettings = { color: 'auto' };

  EndpointAuthorizations: User['EndpointAuthorizations'] = {};

  PortainerAuthorizations: Record<string, boolean> = {};

  AuthenticationMethod: string | number = '';

  Checked = false;

  UseCache = false;

  RoleName: 'administrator' | 'user';

  constructor(data: UserViewModelData = {}) {
    Object.assign(this, data);
    this.RoleName = this.Role === Role.Admin ? 'administrator' : 'user';
  }
}
