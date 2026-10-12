import { EnvironmentMetadata } from '@/domains/environments/services/createEnvironment';

export interface FormValues {
  name: string;
  socketPath: string;
  overridePath: boolean;
  meta: EnvironmentMetadata;
}
