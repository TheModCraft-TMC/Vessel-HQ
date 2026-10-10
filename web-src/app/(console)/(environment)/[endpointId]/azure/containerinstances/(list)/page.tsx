'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ContainersDatatable } from '@/domains/azure/components/ContainerInstances/ListView/ContainersDatatable';
import { useContainerGroups } from '@/domains/azure/queries/useContainerGroups';
import { useSubscriptions } from '@/domains/azure/queries/useSubscriptions';
import { EnvironmentId } from '@/domains/environments';
import { promiseSequence } from '@/portainer/helpers/promise-utils';
import { azureAciClient } from '@/providers/infrastructure/azure-aci';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import {
  notifyError,
  notifySuccess,
} from '@/ui/components/toast/notifications';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  const environmentId = useEnvironmentId();
  const subscriptions = useSubscriptions(environmentId);
  const groups = useContainerGroups(
    environmentId,
    subscriptions.data,
    subscriptions.isSuccess
  );
  const remove = useRemoveContainerGroups(environmentId);

  if (groups.isLoading || subscriptions.isLoading) return null;

  return (
    <>
      <PageHeader
        title="Container list"
        breadcrumbs="Container instances"
        reload
      />
      <ContainersDatatable
        dataset={groups.containerGroups}
        onRemoveClick={remove}
      />
    </>
  );
}

function useRemoveContainerGroups(environmentId: EnvironmentId) {
  const queryClient = useQueryClient();
  const mutation = useMutation(
    (ids: string[]) =>
      promiseSequence(
        ids.map(
          (id) => () => azureAciClient.deleteContainerGroup(environmentId, id)
        )
      ),
    {
      onSuccess: () =>
        queryClient.invalidateQueries([
          'azure',
          environmentId,
          'subscriptions',
        ]),
      onError: (error) =>
        notifyError(
          'Failure',
          error as Error,
          'Unable to remove container groups'
        ),
    }
  );

  return (ids: string[]) =>
    mutation.mutate(ids, {
      onSuccess: () =>
        notifySuccess('Success', 'Container groups successfully removed'),
    });
}
