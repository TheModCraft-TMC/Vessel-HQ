'use client';

import { useStore } from 'zustand';

import { Environment } from '@/domains/environments';
import { environmentStore } from '@/react/hooks/current-environment-store';
import { EnvironmentsDatatable } from '@/react/portainer/environments/ListView/EnvironmentsDatatable';
import { useDeleteEnvironmentsMutation } from '@/react/portainer/environments/ListView/useDeleteEnvironmentsMutation';
import { confirmDelete } from '@/ui/components/dialog/confirm';
import { notifySuccess } from '@/ui/components/toast/notifications';

export function EnvironmentsContent() {
  const currentEnvironment = useStore(environmentStore);
  const deleteEnvironments = useDeleteEnvironmentsMutation();

  return <EnvironmentsDatatable onRemove={handleRemove} />;

  async function handleRemove(environments: Environment[]) {
    const confirmed = await confirmDelete(
      'This action will remove all configurations associated to your environment(s). Continue?'
    );

    if (!confirmed) return;

    if (
      environments.some(
        (environment) => environment.Id === currentEnvironment.environmentId
      )
    ) {
      currentEnvironment.clear();
    }

    deleteEnvironments.mutate(
      environments.map((environment) => ({
        id: environment.Id,
        deleteCluster: false,
        name: environment.Name,
      })),
      {
        onSuccess() {
          notifySuccess(
            'Environments successfully removed',
            environments.map((environment) => environment.Name).join(', ')
          );
        },
      }
    );
  }
}
