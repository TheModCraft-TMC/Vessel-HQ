import { TLSConfig } from '@/core/components/TLSFieldset/types';
import { EnvironmentMetadata } from '@/domains/environments';

export interface GeneralEnvironmentFormValues {
  name: string;
  environmentUrl: string;
  publicUrl: string;

  tls?: TLSConfig;

  meta: EnvironmentMetadata;
}
