import { EdgeGroup } from '@/domains/edge/models/edge-group';
import {
  DeploymentType,
  StaggerConfig,
} from '@/domains/edge/models/edge-stack';
import { EnvVar } from '@/ui/components/forms/EnvironmentVariablesFieldset/types';

export interface FormValues {
  edgeGroups: EdgeGroup['Id'][];
  deploymentType: DeploymentType;
  privateRegistryId?: number;
  content: string;
  useManifestNamespaces: boolean;
  prePullImage: boolean;
  retryDeploy: boolean;
  webhookEnabled: boolean;
  envVars: EnvVar[];
  rollbackTo?: number;
  staggerConfig: StaggerConfig;
}
