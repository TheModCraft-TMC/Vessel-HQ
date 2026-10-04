import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { Pair } from '@/domains/settings';
import { AutoUpdateResponse } from '@/domains/gitops';
import { EnvironmentId } from '@/domains/environments';
import { RegistryId } from '@/domains/registries';
import { StackSecretMapping } from '@/domains/stacks/models/types';
import { Stack } from '@/domains/stacks/models/types';

import { buildCreateUrl } from './buildUrl';

export type SwarmGitRepositoryPayload = {
  /** Name of the stack */
  name: string;
  /** List of environment variables */
  env?: Array<Pair>;
  /** Whether the stack is from an app template */
  fromAppTemplate?: boolean;
  /** Swarm cluster identifier */
  swarmID: string;

  /** URL of a Git repository hosting the Stack file (used for app templates) */
  repositoryUrl?: string;
  /** Reference name of a Git repository hosting the Stack file */
  repositoryReferenceName?: string;

  /** Path to the Stack file inside the Git repository */
  composeFile?: string;

  additionalFiles?: Array<string>;

  /** Optional GitOps update configuration */
  autoUpdate?: AutoUpdateResponse | null;

  /** Vault secret mappings resolved during deployment */
  secretMappings?: StackSecretMapping[];

  /** Whether the stack supports relative path volume */
  supportRelativePath?: boolean;
  /** Local filesystem path */
  filesystemPath?: string;

  /** ID of an existing Source. When set, repositoryUrl and authentication fields are ignored. */
  sourceId?: number;
  environmentId: EnvironmentId;
  registries?: Array<RegistryId>;
};

export async function createSwarmStackFromGit({
  environmentId,
  ...payload
}: SwarmGitRepositoryPayload) {
  try {
    const { data } = await axios.post<Stack>(
      buildCreateUrl('swarm', 'repository'),
      payload,
      {
        params: { endpointId: environmentId },
      }
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}
