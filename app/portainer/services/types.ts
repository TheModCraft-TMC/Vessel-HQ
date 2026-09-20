import { Environment } from '@/react/portainer/environments/types';

export interface StateManager {
  updateEndpointState(endpoint: Environment): Promise<void>;
  updateLogo(logo: string): void;
  updateSnapshotInterval(interval: string): void;
  setPasswordChangeSkipped(userId: string): void;
  resetPasswordChangeSkips(userId: string): void;
  getState(): {
    UI: { timesPasswordChangeSkipped: Record<number, number> };
  };
}

export interface IAuthenticationService {
  getUserDetails(): { ID: number };
  isAuthenticated(): boolean;
  isAdmin(noEnvScope?: boolean): boolean;
  isPureAdmin(): boolean;
  hasAuthorizations(authorizations: string[]): boolean;

  init(): Promise<boolean>;
  //     OAuthLogin,
  //     login,
  //     logout,

  //     redirectIfUnauthorized,
}

export type AsyncService = <T>(fn: () => Promise<T>) => Promise<T>;
