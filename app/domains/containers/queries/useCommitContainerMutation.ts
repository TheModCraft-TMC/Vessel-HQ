import { useMutation, useQueryClient } from '@tanstack/react-query';

import { EnvironmentId } from '@/domains/environments';
import { dockerClient } from '@/core/composition/dockerClient';
import {
  buildImageFullURIFromModel,
  fullURIIntoRepoAndTag,
} from '@/domains/images';
import { useEnvironmentRegistries } from '@/react/portainer/environments/queries/useEnvironmentRegistries';
import { withError } from '@/core/query';

import { queryKeys } from './query-keys';

export function useCommitContainerMutation(environmentId: EnvironmentId) {
  const queryClient = useQueryClient();
  const registriesQuery = useEnvironmentRegistries(environmentId);

  return useMutation({
    mutationFn: async ({
      containerId,
      image,
      registryId,
      useRegistry,
    }: {
      environmentId: EnvironmentId;
      containerId: string;
      image: string;
      registryId?: number;
      useRegistry: boolean;
    }) => {
      const registry = useRegistry
        ? registriesQuery.data?.find((r) => r.Id === registryId)
        : undefined;
      const fullURI = buildImageFullURIFromModel({
        UseRegistry: useRegistry,
        Registry: registry,
        Image: image,
      });
      const { repo, tag } = fullURIIntoRepoAndTag(fullURI);
      return dockerClient.commitContainer<{ Id: string }>(environmentId, {
        container: containerId,
        repo,
        tag,
      });
    },
    ...withError('Unable to create image'),
    onSuccess: (_, { containerId, environmentId }) =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.container(environmentId, containerId),
      }),
  });
}
