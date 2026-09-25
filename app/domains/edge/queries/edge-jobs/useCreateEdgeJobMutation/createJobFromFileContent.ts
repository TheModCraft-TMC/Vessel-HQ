import {
  edgeAgentClient as axios,
  parseAxiosError,
} from '@/providers/infrastructure/edge-agent';
import { EdgeGroup } from '@/domains/edge/models/edge-group';
import { EnvironmentId } from '@/domains/environments';

import { EdgeJob } from '../../../models/edge-job';
import { buildUrl } from '../build-url';

/**
 * Payload for creating an EdgeJob from a string
 */
export interface FileContentPayload {
  name: string;
  cronExpression: string;
  recurring: boolean;

  edgeGroups: Array<EdgeGroup['Id']>;
  endpoints: Array<EnvironmentId>;
  fileContent: string;
}

export async function createJobFromFileContent(payload: FileContentPayload) {
  try {
    const { data } = await axios.post<EdgeJob>(
      buildUrl({ action: 'create/string' }),
      payload
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}
