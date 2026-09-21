import { Radio } from 'lucide-react';
import { useCurrentStateAndParams } from '@uirouter/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { RoleTypes } from '@/portainer/rbac/models/role';
import { notifySuccess } from '@/portainer/services/notifications';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useIdParam } from '@/react/hooks/useIdParam';
import { AccessDatatable } from '@/react/portainer/access-control/AccessManagement/AccessDatatable/AccessDatatable';
import { Access } from '@/react/portainer/access-control/AccessManagement/AccessDatatable/types';
import { CreateAccessWidget } from '@/react/portainer/access-control/AccessManagement/CreateAccessWidget';
import { Option } from '@/react/portainer/access-control/AccessManagement/PorAccessManagementUsersSelector';
import { useAccesses } from '@/react/portainer/access-control/AccessManagement/useAccesses';
import { useEnvironment } from '@/react/portainer/environments/queries';
import { useGroup } from '@/react/portainer/environments/environment-groups/queries/useGroup';
import { updateEnvironmentRegistryAccess } from '@/react/portainer/environments/environment.service/registries';
import { withError } from '@/core/query/query-client';

import { PageHeader } from '@@/PageHeader';
import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';

import { useRegistry } from '../../queries/useRegistry';
import { queryKeys } from '../../queries/query-keys';

export function RegistryAccessView() {
  const environmentId = useEnvironmentId();
  const registryId = useIdParam();
  const { state } = useCurrentStateAndParams();
  const registryQuery = useRegistry(registryId);
  const environmentQuery = useEnvironment(environmentId);
  const environment = environmentQuery.data;
  const groupQuery = useGroup(environment?.GroupId, { enabled: !!environment });
  const registry = registryQuery.data;
  const registryAccess = registry?.RegistryAccesses?.[environmentId];
  const accesses = useAccesses(registryAccess);
  const updateMutation = useUpdateRegistryAccessMutation(
    environmentId,
    registryId
  );
  const registryListRoute = state.name?.includes('.swarm.')
    ? 'docker.swarm.registries'
    : 'docker.host.registries';

  const allowedUsers = {
    ...(environment?.UserAccessPolicies || {}),
    ...(groupQuery.data?.UserAccessPolicies || {}),
  };
  const allowedTeams = {
    ...(environment?.TeamAccessPolicies || {}),
    ...(groupQuery.data?.TeamAccessPolicies || {}),
  };
  const availableUsersAndTeams = accesses.availableUsersAndTeams.filter(
    (access) =>
      access.Type === 'user'
        ? !!allowedUsers[access.Id]
        : !!allowedTeams[access.Id]
  );

  return (
    <>
      <PageHeader
        title="Registry access"
        breadcrumbs={[
          { label: 'Registries', link: registryListRoute },
          registry?.Name || 'Registry',
          'Access management',
        ]}
        reload
      />

      <div className="mx-4 space-y-4">
        <Widget>
          <WidgetTitle icon={Radio} title="Registry" />
          <WidgetBody loading={registryQuery.isLoading} className="!p-0">
            {registry && (
              <table className="table mb-0">
                <tbody>
                  <tr>
                    <td>Name</td>
                    <td>{registry.Name}</td>
                  </tr>
                  <tr>
                    <td>URL</td>
                    <td>{registry.URL}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </WidgetBody>
        </Widget>

        <CreateAccessWidget
          availableUsersAndTeams={availableUsersAndTeams as Array<Option>}
          isLoading={
            accesses.isLoading ||
            environmentQuery.isLoading ||
            groupQuery.isLoading
          }
          isUpdating={updateMutation.isLoading}
          onSubmit={handleCreate}
          showRole={false}
          showWarning={false}
        />
      </div>

      <AccessDatatable
        tableKey="access_registry"
        dataset={accesses.authorizedUsersAndTeams}
        onRemove={handleRemove}
        onUpdate={() => undefined}
        isUpdatingAccess={updateMutation.isLoading}
        isLoading={accesses.isLoading || registryQuery.isLoading}
      />
    </>
  );

  function handleCreate(
    selected: Array<Option>,
    _roleId: number,
    onSuccess: () => void
  ) {
    updatePolicies(
      selected.map((access) => ({
        ...access,
        Role: { Id: RoleTypes.STANDARD },
      })),
      'set',
      onSuccess
    );
  }

  function handleRemove(selected: Array<Access>) {
    updatePolicies(selected, 'delete');
  }

  function updatePolicies(
    selected: Array<{ Id: number; Type: string; Role?: { Id: number } }>,
    action: 'set' | 'delete',
    onSuccess?: () => void
  ) {
    const userAccessPolicies = { ...(registryAccess?.UserAccessPolicies || {}) };
    const teamAccessPolicies = { ...(registryAccess?.TeamAccessPolicies || {}) };

    selected.forEach((access) => {
      const policies =
        access.Type === 'user' ? userAccessPolicies : teamAccessPolicies;
      if (action === 'delete') {
        delete policies[access.Id];
      } else {
        policies[access.Id] = { RoleId: access.Role?.Id || RoleTypes.STANDARD };
      }
    });

    updateMutation.mutate(
      { UserAccessPolicies: userAccessPolicies, TeamAccessPolicies: teamAccessPolicies },
      {
        onSuccess: () => {
          notifySuccess('Success', 'Access successfully updated');
          onSuccess?.();
        },
      }
    );
  }
}

function useUpdateRegistryAccessMutation(
  environmentId: number,
  registryId: number
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (access: Parameters<typeof updateEnvironmentRegistryAccess>[2]) =>
      updateEnvironmentRegistryAccess(environmentId, registryId, access),
    onSuccess: () => queryClient.invalidateQueries(queryKeys.item(registryId)),
    ...withError('Unable to update accesses'),
  });
}
