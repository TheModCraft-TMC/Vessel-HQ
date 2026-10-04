import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveAs } from 'file-saver';

import {
  edgeAgentClient as axios,
  parseAxiosError,
} from '@/providers/infrastructure/edge-agent';
import { EnvironmentId } from '@/domains/environments';
import { withInvalidate } from '@/core/query';

import { EdgeJob } from '../../../models/edge-job';

import { buildUrl } from './build-url';
import { queryKeys } from './query-keys';

export function useDownloadLogsMutation(id: EdgeJob['Id']) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (environmentId: EnvironmentId) =>
      downloadLogsMutation(id, environmentId),
    ...withInvalidate(queryClient, [queryKeys.base(id)]),
  });
}

async function downloadLogsMutation(
  id: EdgeJob['Id'],
  environmentId: EnvironmentId
) {
  try {
    const { data } = await axios.get<{ FileContent: string }>(
      buildUrl({ id, action: 'logs', taskId: environmentId })
    );
    const downloadData = new Blob([data.FileContent], {
      type: 'text/plain;charset=utf-8',
    });
    const logFileName = `job_${id}_task_${environmentId}.log`;
    saveAs(downloadData, logFileName);
    return data;
  } catch (err) {
    throw parseAxiosError(err, 'Unable to download file');
  }
}
