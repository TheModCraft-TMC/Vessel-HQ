import { EnvVarValues } from '@/ui/components/forms/EnvironmentVariablesFieldset';

export interface StackEditorFormValues {
  stackFileContent: string;
  environmentVariables: EnvVarValues;
  rollbackTo?: number;
  prune: boolean;
  enabledWebhook: boolean;
}
