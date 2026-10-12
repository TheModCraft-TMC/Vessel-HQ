import { AccessControlFormData } from '@/domains/access-control';

export interface FormValues {
  name: string;
  envVars: Record<string, string | undefined>;
  accessControl: AccessControlFormData;
}
