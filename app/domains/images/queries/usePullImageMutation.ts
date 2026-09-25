import { useMutation, useQueryClient } from '@tanstack/react-query';

import { EnvironmentId } from '@/domains/environments';
import { Registry } from '@/domains/registries';
import { useEnvironmentRegistries } from '@/react/portainer/environments/queries/useEnvironmentRegistries';
import { withError, withInvalidate } from '@/core/query';
import { dockerClient } from '@/core/composition/dockerClient';

import { buildImageFullURI } from '../mappers/image';

import { queryKeys } from './queryKeys';

type UsePullImageMutation = Omit<PullImageOptions, 'registry'> & {
  registryId?: Registry['Id'];
};

export function usePullImageMutation(envId: EnvironmentId) {
  const queryClient = useQueryClient();
  const registriesQuery = useEnvironmentRegistries(envId);

  return useMutation({
    mutationFn: (args: UsePullImageMutation) =>
      pullImage({
        ...args,
        registry: getRegistry(registriesQuery.data || [], args.registryId),
      }),
    ...withError('Failure', 'Failed pulling image'),
    ...withInvalidate(queryClient, [queryKeys.base(envId)]),
  });
}

function getRegistry(registries: Registry[], registryId?: Registry['Id']) {
  return registryId
    ? registries.find((registry) => registry.Id === registryId)
    : undefined;
}

interface PullImageOptions {
  environmentId: EnvironmentId;
  image: string;
  nodeName?: string;
  registry?: Registry;
  ignoreErrors: boolean;
}

export async function pullImage({
  environmentId,
  ignoreErrors,
  image,
  nodeName,
  registry,
}: PullImageOptions) {
  const imageURI = buildImageFullURI(image, registry);

  try {
    await dockerClient.pullImage(environmentId, {
      image: imageURI,
      nodeName,
      registryId: registry?.Id,
    });
  } catch (error) {
    if (!ignoreErrors) throw error;
  }
}
