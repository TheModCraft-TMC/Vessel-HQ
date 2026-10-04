import { mixed, number, object, SchemaOf } from 'yup';

import { variablesFieldValidation } from '@/domains/templates';
import { VariableDefinition } from '@/domains/templates';
import { envVarsFieldsetValidation } from '@/domains/templates';
import { TemplateEnv } from '@/domains/templates';

import { Values } from './types';

export function templateFieldsetValidation({
  customVariablesDefinitions,
  appTemplateVariablesDefinitions,
}: {
  customVariablesDefinitions: Array<VariableDefinition>;
  appTemplateVariablesDefinitions: Array<TemplateEnv>;
}): SchemaOf<Values> {
  return object({
    type: mixed<'app' | 'custom'>().oneOf(['custom', 'app']).optional(),
    envVars: envVarsFieldsetValidation(appTemplateVariablesDefinitions)
      .optional()
      .when('type', {
        is: 'app',
        then: (schema: SchemaOf<unknown, never>) => schema.required(),
      }),
    templateId: mixed()
      .optional()
      .when('type', {
        is: true,
        then: () => number().required(),
      }),
    variables: variablesFieldValidation(customVariablesDefinitions)
      .optional()
      .when('type', {
        is: 'custom',
        then: (schema) => schema.required(),
      }),
  });
}
