import _ from 'lodash';

import { dockerClient } from '@/core/composition/dockerClient';
import { EnvironmentId } from '@/domains/environments';
import { ServiceId } from '@/domains/services/types';

type ServiceLogsParams = {
  stdout?: boolean;
  stderr?: boolean;
  timestamps?: boolean;
  since?: number;
  tail?: number;
};

export async function getServiceLogs(
  environmentId: EnvironmentId,
  serviceId: ServiceId,
  params?: ServiceLogsParams
): Promise<string> {
  return dockerClient.getServiceLogs(
    environmentId,
    serviceId,
    _.pickBy(params)
  );
}
