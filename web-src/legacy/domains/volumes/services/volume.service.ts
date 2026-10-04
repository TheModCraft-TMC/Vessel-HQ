import { Volume } from '@/providers/infrastructure/docker';
import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/domains/environments';
import { buildDockerProxyUrl } from '@/providers/infrastructure/docker';
import {
  withAgentTargetHeader,
  withFiltersQueryParam,
} from '@/react/docker/proxy/queries/utils';

export type VolumeFilters = {
  dangling?: ['true' | 'false'];
  driver?: string;
  label?: string;
  name?: Volume['Name'];
};

interface VolumesResponse {
  Volumes: Volume[];
}

export async function getVolumes(
  environmentId: EnvironmentId,
  filters?: VolumeFilters
) {
  try {
    const { data } = await axios.get<VolumesResponse>(
      buildDockerProxyUrl(environmentId, 'volumes'),
      { params: withFiltersQueryParam(filters) }
    );
    return data.Volumes;
  } catch (error) {
    throw parseAxiosError(error, 'Unable to retrieve volumes');
  }
}

/**
 * Raw docker API query
 * @param environmentId
 * @param name
 * @returns
 */
export async function getVolume(
  environmentId: EnvironmentId,
  name: Volume['Name'],
  { nodeName }: { nodeName?: string } = {}
) {
  try {
    const { data } = await axios.get(
      buildDockerProxyUrl(environmentId, 'volumes', name),
      { headers: { ...withAgentTargetHeader(nodeName) } }
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to retrieve volume details');
  }
}
