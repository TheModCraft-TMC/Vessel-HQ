import { convertToArrayOfStrings } from '@/ui/components/forms/EnvironmentVariablesFieldset/utils';
import { EnvVarValues } from '@/ui/components/forms/EnvironmentVariablesFieldset';

import { CreateContainerRequest } from '../types';

export function toRequest(
  oldConfig: CreateContainerRequest,
  values: EnvVarValues
): CreateContainerRequest {
  return {
    ...oldConfig,
    Env: convertToArrayOfStrings(values),
  };
}
