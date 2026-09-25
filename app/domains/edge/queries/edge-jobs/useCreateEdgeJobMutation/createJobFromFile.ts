import {
  edgeAgentClient as axios,
  parseAxiosError,
} from '@/providers/infrastructure/edge-agent';
import { EdgeGroup } from '@/domains/edge/models/edge-group';
import { EnvironmentId } from '@/domains/environments';
import { json2formData } from '@/portainer/helpers/json';

import { EdgeJob } from '../../../models/edge-job';
import { buildUrl } from '../build-url';

/**
 * Payload to create an EdgeJob from a file
 */
export type FileUploadPayload = {
  Name: string;
  CronExpression: string;
  Recurring: boolean;

  EdgeGroups: Array<EdgeGroup['Id']>;
  Endpoints: Array<EnvironmentId>;
  File: File;
};

export async function createJobFromFile(payload: FileUploadPayload) {
  try {
    const { data } = await axios.post<EdgeJob>(
      buildUrl({ action: 'create/file' }),
      json2formData(payload),
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}
