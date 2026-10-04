import { useMutation } from '@tanstack/react-query';

import { EnvironmentId } from '@/domains/environments';
import { dockerClient } from '@/core/composition/dockerClient';
import { promiseSequence } from '@/portainer/helpers/promise-utils';
import { withError } from '@/core/query';

import { removeWebhooksForService } from '../../webhooks/removeWebhook';

export function useRemoveServicesMutation(environmentId: EnvironmentId) {
  return useMutation(
    (ids: Array<string>) =>
      promiseSequence(ids.map((id) => () => removeService(environmentId, id))),
    withError('Unable to remove services')
  );
}

export async function removeService(
  environmentId: EnvironmentId,
  serviceId: string
) {
  await dockerClient.removeService(environmentId, serviceId);

  await removeWebhooksForService(environmentId, serviceId);
}
