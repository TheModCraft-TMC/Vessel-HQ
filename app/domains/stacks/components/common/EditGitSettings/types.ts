import { GitFormModel } from '@/domains/gitops';
import { StackSecretMapping } from '@/domains/stacks/models/types';
import { EnvVarValues } from '@/ui/components/forms/EnvironmentVariablesFieldset';

export interface FormValues {
  kube: { name: string };
  git: GitFormModel;
  env: EnvVarValues;
  secretMappings: StackSecretMapping[];
  prune: boolean;
  redeployNow: boolean;
}
