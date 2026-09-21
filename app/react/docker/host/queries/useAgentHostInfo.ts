import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { withAgentTargetHeader } from '@/react/docker/proxy/queries/utils';
import { EnvironmentId } from '@/features/environments';

export type AgentHostInfo = {
  PCIDevices: Array<{ Name: string; Vendor: string }>;
  PhysicalDisks: Array<{ Vendor: string; Size: number }>;
};

export function useAgentHostInfo(
  environmentId: EnvironmentId,
  apiVersion: number,
  nodeName?: string,
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery(
    ['environment', environmentId, 'agent', 'host-info', nodeName],
    () => getAgentHostInfo(environmentId, apiVersion, nodeName),
    { enabled }
  );
}

async function getAgentHostInfo(
  environmentId: EnvironmentId,
  apiVersion: number,
  nodeName?: string
) {
  try {
    const { data } = await axios.get<AgentHostInfo>(
      `/endpoints/${environmentId}/docker/v${apiVersion}/host/info`,
      { headers: { ...withAgentTargetHeader(nodeName) } }
    );
    return data;
  } catch (error) {
    throw parseAxiosError(error, 'Unable to retrieve host information');
  }
}
