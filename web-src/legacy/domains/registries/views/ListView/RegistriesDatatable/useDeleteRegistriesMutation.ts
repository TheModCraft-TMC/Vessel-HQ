import { useMutation, useQueryClient } from '@tanstack/react-query';

import { promiseSequence } from '@/portainer/helpers/promise-utils';
import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { mutationOptions, withError, withInvalidate } from '@/core/query';
import { buildUrl } from '@/domains/registries/queries/build-url';
import { queryKeys } from '@/domains/registries/queries/query-keys';
import { Registry } from '@/domains/registries/models/registry';

export function useDeleteRegistriesMutation() {
  const queryClient = useQueryClient();
  return useMutation(
    (RegistryIds: Array<Registry['Id']>) =>
      promiseSequence(
        RegistryIds.map((RegistryId) => () => deleteRegistry(RegistryId))
      ),
    mutationOptions(
      withError('Unable to delete registries'),
      withInvalidate(queryClient, [queryKeys.base()])
    )
  );
}

async function deleteRegistry(id: Registry['Id']) {
  try {
    await axios.delete(buildUrl(id));
  } catch (e) {
    throw parseAxiosError(e, 'Unable to delete registries');
  }
}
