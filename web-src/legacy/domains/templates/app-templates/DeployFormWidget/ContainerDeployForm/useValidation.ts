import { object, string } from 'yup';
import { useMemo } from 'react';

import { accessControlFormValidation } from '@/react/portainer/access-control/AccessControlForm';
import {
  hostnameSchema,
  hostFileSchema,
  labelsTabUtils,
  containerNameValidation as nameValidation,
  portMappingValidationSchema as portSchema,
  volumesTabUtils,
} from '@/domains/containers';

import { envVarsFieldsetValidation } from '../EnvVarsFieldset';
import { TemplateEnv } from '../../types';

export function useValidation({
  isAdmin,
  envVarDefinitions,
}: {
  isAdmin: boolean;
  envVarDefinitions: Array<TemplateEnv>;
}) {
  return useMemo(
    () =>
      object({
        accessControl: accessControlFormValidation(isAdmin),
        envVars: envVarsFieldsetValidation(envVarDefinitions),
        hostname: hostnameSchema,
        hosts: hostFileSchema,
        labels: labelsTabUtils.validation(),
        name: nameValidation(),
        network: string().default(''),
        ports: portSchema(),
        volumes: volumesTabUtils.validation(),
      }),
    [envVarDefinitions, isAdmin]
  );
}
