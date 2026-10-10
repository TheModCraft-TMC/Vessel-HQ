'use client';

import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { withError } from '@/core/query';
import { SecretViewModel } from '@/domains/services/models/secret';
import { SecretsDatatable } from '@/domains/services/secrets/ListView/SecretsDatatable';
import {
  getSecrets,
  removeSecret,
} from '@/domains/services/secrets/queries/useSecrets';
import { processItemsInBatches } from '@/react/common/processItemsInBatches';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { notifySuccess } from '@/ui/components/toast/notifications';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  const environmentId = useEnvironmentId();
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => ['docker', environmentId, 'secrets'] as const,
    [environmentId]
  );
  const secretsQuery = useQuery(
    queryKey,
    async () =>
      (await getSecrets(environmentId)).map(
        (secret: ConstructorParameters<typeof SecretViewModel>[0]) =>
          new SecretViewModel(secret)
      ),
    withError('Unable to retrieve secrets')
  );
  const removeSecretMutation = useMutation(
    (secret: SecretViewModel) => removeSecret(environmentId, secret.Id),
    {
      ...withError('Unable to remove secret'),
      onSuccess: (_data, secret) =>
        notifySuccess('Secret successfully removed', secret.Name),
    }
  );
  const handleRemove = useCallback(
    async (secrets: SecretViewModel[]) => {
      await processItemsInBatches(secrets, (secret) =>
        removeSecretMutation.mutateAsync(secret)
      );
      await queryClient.invalidateQueries(queryKey);
    },
    [queryClient, queryKey, removeSecretMutation]
  );

  return (
    <>
      <PageHeader title="Secrets list" breadcrumbs="Secrets" reload />
      <SecretsDatatable dataset={secretsQuery.data} onRemove={handleRemove} />
    </>
  );
}
