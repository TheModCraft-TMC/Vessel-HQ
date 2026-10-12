import { EnvironmentMetadata } from '@/domains/environments';

export interface AzureEnvironmentFormValues {
  name: string;
  environmentUrl: string;
  azure: {
    applicationId: string;
    tenantId: string;
    authenticationKey: string;
  };
  meta: EnvironmentMetadata;
}
