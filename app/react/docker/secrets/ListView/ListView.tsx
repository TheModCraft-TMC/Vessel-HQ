import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { SecretViewModel } from '@/docker/models/secret';
import { notifySuccess } from '@/portainer/services/notifications';
import { processItemsInBatches } from '@/react/common/processItemsInBatches';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { getSecrets } from '@/react/docker/proxy/queries/secrets/useSecrets';
import { removeSecret } from '@/react/docker/proxy/queries/secrets/useRemoveSecretMutation';
import { withError } from '@/core/query/query-client';

import { PageHeader } from '@@/PageHeader';

import { SecretsDatatable } from './SecretsDatatable';

export function ListView() {
  const environmentId = useEnvironmentId();
  const queryClient = useQueryClient();
  const queryKey = ['docker', environmentId, 'secrets'] as const;
  const secretsQuery = useQuery(
    queryKey,
    async () =>
      (await getSecrets(environmentId)).map(
        (secret: ConstructorParameters<typeof SecretViewModel>[0]) =>
          new SecretViewModel(secret)
      ),
    withError('Unable to retrieve secrets')
  );
  const removeMutation = useMutation(
    (secret: SecretViewModel) => removeSecret(environmentId, secret.Id),
    {
      ...withError('Unable to remove secret'),
      onSuccess: (_data, secret) =>
        notifySuccess('Secret successfully removed', secret.Name),
    }
  );

  return (
    <>
      <PageHeader title="Secrets list" breadcrumbs="Secrets" reload />
      <SecretsDatatable
        dataset={secretsQuery.data}
        onRemove={handleRemove}
      />
    </>
  );

  async function handleRemove(selectedItems: Array<SecretViewModel>) {
    await processItemsInBatches(selectedItems, (secret) =>
      removeMutation.mutateAsync(secret)
    );
    await queryClient.invalidateQueries(queryKey);
  }
}
