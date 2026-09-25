import type { ImageInspect } from '@/providers/infrastructure/docker';

import { dockerClient } from '@/core/composition/dockerClient';
import { EnvironmentId } from '@/domains/environments';

export function getImage(
  environmentId: EnvironmentId,
  imageId: string,
  options?: { nodeName?: string }
) {
  return dockerClient.inspectImage<ImageInspect>(
    environmentId,
    imageId,
    options
  );
}

export function getImageHistory(
  environmentId: EnvironmentId,
  imageId: string,
  options?: { nodeName?: string }
) {
  return dockerClient.getImageHistory(environmentId, imageId, options);
}

export function tagImage(
  environmentId: EnvironmentId,
  imageId: string,
  repo: string,
  tag?: string,
  options?: { nodeName?: string }
) {
  return dockerClient.tagImage(environmentId, imageId, {
    repo,
    tag,
    ...options,
  });
}

export function uploadImages(
  environmentId: EnvironmentId,
  file: File,
  options?: { nodeName?: string }
) {
  return dockerClient
    .uploadImage(environmentId, file, { contentType: file.type, ...options })
    .then((data) => ({ data }));
}

export async function downloadImages(
  environmentId: EnvironmentId,
  images: { tags: string[]; id: string }[],
  options?: { nodeName?: string }
) {
  const names = images.map((image) =>
    image.tags[0] !== '<none>:<none>' ? image.tags[0] : image.id
  );
  const { data } = await dockerClient.downloadImages(
    environmentId,
    names,
    options
  );
  return data;
}
