import { EnvironmentId } from '@/domains/environments';
import { Registry } from '@/domains/registries';
import PortainerError from '@/portainer/error';
import { dockerClient } from '@/core/composition/dockerClient';

import { buildImageFullURI } from '../mappers/image';

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

  const data = await dockerClient.pushImage(environmentId, imageURI, {
    nodeName,
    registryId: registry?.Id,
  });

  if (Array.isArray(data) && data[data.length - 1]?.error) {
    throw new PortainerError(data[data.length - 1].error);
  }
}
