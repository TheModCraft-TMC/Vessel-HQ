import { useMemo } from 'react';
import { SchemaOf, object } from 'yup';

import { accessControlFormValidation } from '@/react/portainer/access-control/AccessControlForm';
import { useNameValidation } from '@/domains/stacks';
import { EnvironmentId } from '@/domains/environments';

import { envVarsFieldsetValidation } from '../EnvVarsFieldset';
import { TemplateEnv } from '../../types';

import { FormValues } from './types';

export function useValidation({
  environmentId,
  isAdmin,
  envVarDefinitions,
}: {
  isAdmin: boolean;
  environmentId: EnvironmentId;
  envVarDefinitions: Array<TemplateEnv>;
}): SchemaOf<FormValues> {
  const name = useNameValidation(environmentId);

  return useMemo(
    () =>
      object({
        name,
        accessControl: accessControlFormValidation(isAdmin),
        envVars: envVarsFieldsetValidation(envVarDefinitions),
      }),
    [envVarDefinitions, isAdmin, name]
  );
}
