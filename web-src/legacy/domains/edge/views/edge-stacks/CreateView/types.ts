import { RegistryId } from '@/domains/registries';
import { GitFormModel, RelativePathModel } from '@/domains/gitops';
import { EnvVarValues } from '@/ui/components/forms/EnvironmentVariablesFieldset';
import { EdgeGroup } from '@/domains/edge/models/edge-group';
import {
  DeploymentType,
  StaggerConfig,
} from '@/domains/edge/models/edge-stack';

import { KubeFormValues } from './KubeManifestForm';
import { Values as TemplateFieldsetValues } from './TemplateFieldset/types';

export type Method = 'editor' | 'upload' | 'repository' | 'template';

export interface DockerFormValues {
  method: Method;
  fileContent: string;
  file?: File;
  templateValues: TemplateFieldsetValues;
  git: GitFormModel;
  relativePath: RelativePathModel;
}

export interface FormValues extends KubeFormValues, DockerFormValues {
  method: Method;
  name: string;
  groupIds: Array<EdgeGroup['Id']>;
  deploymentType: DeploymentType;
  envVars: EnvVarValues;
  privateRegistryId: RegistryId;
  prePullImage: boolean;
  retryDeploy: boolean;
  enableWebhook: boolean;
  staggerConfig: StaggerConfig;
}
