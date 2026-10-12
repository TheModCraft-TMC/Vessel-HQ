import { UserId } from '@/domains/users';

export interface FormValues {
  name: string;
  leaders: UserId[];
}
