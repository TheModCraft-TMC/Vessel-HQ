import { object, SchemaOf, string } from 'yup';

import { useNameValidation } from '@/domains/environments';
import { EnvironmentId } from '@/domains/environments';
import { metadataValidation } from '@/domains/environments';

import { AzureEnvironmentFormValues } from './types';

export function useAzureValidation({
  environmentId,
}: {
  environmentId: EnvironmentId;
}): SchemaOf<AzureEnvironmentFormValues> {
  return object({
    name: useNameValidation(environmentId),
    environmentUrl: string().default(''),
    azure: object({
      applicationId: string().default(''),
      tenantId: string().default(''),
      authenticationKey: string().default(''),
    }).required(),
    meta: metadataValidation(),
  });
}
