import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { withError, withInvalidate } from '@/core/query';
import { updateEnvironmentRegistryAccess } from '@/react/portainer/environments/environment.service/registries';
import { EnvironmentId } from '@/domains/environments';
import { notifyError } from '@/ui/components/toast/notifications';
import { environmentQueryKeys } from '@/react/portainer/environments/queries/query-keys';
import { updateIngressControllerClassMap } from '@/domains/clusters';
import type { IngressControllerClassMap } from '@/domains/clusters';

import { Namespaces, NamespacePayload, UpdateRegistryPayload } from '../types';

export function useUpdateNamespaceMutation(environmentId: EnvironmentId) {
  const queryClient = useQueryClient();
  return useMutation(
    async ({
      createNamespacePayload,
      updateRegistriesPayload,
      namespaceIngressControllerPayload,
    }: {
      createNamespacePayload: NamespacePayload;
      updateRegistriesPayload: UpdateRegistryPayload[];
      namespaceIngressControllerPayload: IngressControllerClassMap[];
    }) => {
      const { Name: namespaceName } = createNamespacePayload;
      const updatedNamespace = await updateNamespace(
        environmentId,
        namespaceName,
        createNamespacePayload
      );

      // collect promises
      const updateRegistriesPromises = updateRegistriesPayload.map(
        ({ Id, Namespaces }) =>
          updateEnvironmentRegistryAccess(environmentId, Id, {
            Namespaces,
          })
      );
      const updateIngressControllerPromise = updateIngressControllerClassMap(
        environmentId,
        namespaceIngressControllerPayload,
        createNamespacePayload.Name
      );
      const results = await Promise.allSettled([
        updateIngressControllerPromise,
        ...updateRegistriesPromises,
      ]);
      // Check for any failures in the additional updates
      const failures = results.filter((result) => result.status === 'rejected');
      failures.forEach((failure) => {
        const errorMessage =
          typeof failure.reason?.err?.message === 'string'
            ? failure.reason?.err?.message
            : '';
        notifyError('Unable to update namespace', undefined, errorMessage);
      });
      return updatedNamespace;
    },
    {
      ...withError('Unable to update namespace'),
      //
      ...withInvalidate(queryClient, [
        environmentQueryKeys.item(environmentId),
      ]),
    }
  );
}

// updateNamespace is used to update a namespace using the Portainer backend
async function updateNamespace(
  environmentId: EnvironmentId,
  namespace: string,
  payload: NamespacePayload
) {
  try {
    const { data: ns } = await axios.put<Namespaces>(
      `kubernetes/${environmentId}/namespaces/${namespace}`,
      payload
    );
    return ns;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to create namespace');
  }
}
