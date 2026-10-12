import { imageContainsURL } from '@/domains/images/mappers/image';
import {
  Registry,
  RegistryId,
} from '@/domains/registries';
import { getRegistryURL as getURL } from '@/domains/registries';

import { findBestMatchRegistry } from './findRegistryMatch';
import { Values as ImageConfigValues } from './types';

export function getDefaultImageConfig(): ImageConfigValues {
  return {
    registryId: 0,
    image: '',
    useRegistry: true,
  };
}

export function getImageConfig(
  repository: string,
  registries: Registry[],
  registryId?: RegistryId
): ImageConfigValues {
  const registry = findBestMatchRegistry(repository, registries, registryId);
  if (registry) {
    const url = getURL(registry);
    let lastIndex = repository.lastIndexOf(url);
    lastIndex = lastIndex === -1 ? 0 : lastIndex + url.length;
    let image = repository.substring(lastIndex);
    if (image.startsWith('/')) {
      image = image.substring(1);
    }

    return {
      useRegistry: true,
      image,
      registryId: registry.Id,
    };
  }
  return {
    image: repository,
    useRegistry: imageContainsURL(repository),
  };
}
