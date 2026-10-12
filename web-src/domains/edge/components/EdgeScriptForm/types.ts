import { TagId } from '@/domains/tags';
import { EnvironmentGroupId } from '@/domains/environments';
import { EdgeGroup } from '@/domains/edge/models/edge-group';

export type Platform = 'standalone' | 'swarm' | 'podman' | 'k8s' | 'kubesolo';
export type OS = 'win' | 'linux';

export interface ScriptFormValues {
  authEnabled: boolean;
  tlsEnabled: boolean;

  allowSelfSignedCertificates: boolean;
  envVars: string;

  os: OS;
  platform: Platform;

  edgeIdGenerator: string;

  group: EnvironmentGroupId;
  edgeGroupsIds: Array<EdgeGroup['Id']>;
  tagsIds: Array<TagId>;
}

export interface EdgeInfo {
  id?: string;
  key: string;
}
