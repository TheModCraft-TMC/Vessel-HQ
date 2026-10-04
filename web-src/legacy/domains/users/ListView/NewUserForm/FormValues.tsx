import { TeamId } from '@/domains/teams';

export interface FormValues {
  username: string;
  password: string;
  confirmPassword: string;
  isAdmin: boolean;
  teams: TeamId[];
}
