import { TLSConfig } from '@/core/components/TLSFieldset/types';
import { EnvironmentMetadata } from '@/domains/environments/services/createEnvironment';

export interface FormValues {
  name: string;
  url: string;
  tlsConfig: TLSConfig;
  meta: EnvironmentMetadata;
}
