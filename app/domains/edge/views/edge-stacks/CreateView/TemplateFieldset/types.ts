import { VariablesFieldValue } from '@/domains/templates';
import { EnvVarsValue } from '@/domains/templates';

export type SelectedTemplateValue =
  | { templateId: number; type: 'custom' }
  | { templateId: number; type: 'app' }
  | { templateId: undefined; type: undefined };

export type Values = {
  variables: VariablesFieldValue;
  envVars: EnvVarsValue;
} & SelectedTemplateValue;
