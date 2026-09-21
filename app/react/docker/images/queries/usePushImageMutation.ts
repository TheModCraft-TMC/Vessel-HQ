import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/domains/environments';
import { Registry } from '@/react/portainer/registries/types/registry';
import PortainerError from '@/portainer/error';
import { jsonObjectsToArrayHandler } from '@/portainer/helpers/json';

import { buildImageFullURI } from '../utils';
import {
  withAgentTargetHeader,
  withRegistryAuthHeader,
} from '../../proxy/queries/utils';
import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';

interface PushImageOptions {
  environmentId: EnvironmentId;
  image: string;
  registry?: Registry;
  nodeName?: string;
}

export async function pushImage({
  environmentId,
  image,
  registry,
  nodeName,
}: PushImageOptions) {
  const imageURI = buildImageFullURI(image, registry);

  try {
    const { data } = await axios.post(
      buildDockerProxyUrl(environmentId, 'images', imageURI, 'push'),
      null,
      {
        headers: {
          ...withRegistryAuthHeader(registry?.Id),
          ...withAgentTargetHeader(nodeName),
        },
        transformResponse: jsonObjectsToArrayHandler,
      }
    );

    if (data[data.length - 1].error) {
      throw new PortainerError(data[data.length - 1].error);
    }
  } catch (err) {
    throw parseAxiosError(err, 'Unable to push image');
  }
}
