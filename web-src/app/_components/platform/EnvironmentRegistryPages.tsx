'use client';

import { Radio } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { withError } from '@/core/query';
import { queryKeys } from '@/domains/registries/queries/query-keys';
import { useRegistry } from '@/domains/registries/queries/useRegistry';
import { RoleTypes } from '@/portainer/rbac/models/role';
import { AccessDatatable } from '@/react/portainer/access-control/AccessManagement/AccessDatatable/AccessDatatable';
import { Access } from '@/react/portainer/access-control/AccessManagement/AccessDatatable/types';
import { CreateAccessWidget } from '@/react/portainer/access-control/AccessManagement/CreateAccessWidget';
import { Option } from '@/react/portainer/access-control/AccessManagement/PorAccessManagementUsersSelector';
import { useAccesses } from '@/react/portainer/access-control/AccessManagement/useAccesses';
import { useGroup } from '@/react/portainer/environments/environment-groups/queries/useGroup';
import { updateEnvironmentRegistryAccess } from '@/react/portainer/environments/environment.service/registries';
import { useEnvironment } from '@/react/portainer/environments/queries';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useIdParam } from '@/react/hooks/useIdParam';
import { notifySuccess } from '@/ui/components/toast/notifications';
import { PageHeader } from '@/ui/layouts/view-layout';

import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';

export function EnvironmentRegistryAccessHeader({
  registryListRoute,
}: {
  registryListRoute:
    | '/:endpointId/docker/swarm/registries'
    | '/:endpointId/docker/host/registries';
}) {
  const registryId = useIdParam();
  const registryQuery = useRegistry(registryId);

  return (
    <PageHeader
      title="Registry access"
      breadcrumbs={[
        { label: 'Registries', link: registryListRoute },
        registryQuery.data?.Name || 'Registry',
        'Access management',
      ]}
      reload
    />
  );
}

export function EnvironmentRegistryAccessContent() {
  const environmentId = useEnvironmentId();
  const registryId = useIdParam();
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
  const allowedUsers: Record<number, unknown> = {
    ...(environment?.UserAccessPolicies || {}),
    ...(groupQuery.data?.UserAccessPolicies || {}),
  };
  const allowedTeams: Record<number, unknown> = {
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
      <RegistrySummary
        registry={registry}
        isLoading={registryQuery.isLoading}
      />
      <RegistryAccessManager
        available={availableUsersAndTeams as Array<Option>}
        authorized={accesses.authorizedUsersAndTeams}
        isLoading={
          accesses.isLoading ||
          environmentQuery.isLoading ||
          groupQuery.isLoading
        }
        isUpdating={updateMutation.isLoading}
        onCreate={(selected, onSuccess) =>
          updatePolicies(
            selected.map((access) => ({
              ...access,
              Role: { Id: RoleTypes.STANDARD },
            })),
            'set',
            onSuccess
          )
        }
        onRemove={(selected) => updatePolicies(selected, 'delete')}
      />
    </>
  );

  function updatePolicies(
    selected: Array<{ Id: number; Type: string; Role?: { Id: number } }>,
    action: 'set' | 'delete',
    onSuccess?: () => void
  ) {
    const userAccessPolicies = {
      ...(registryAccess?.UserAccessPolicies || {}),
    };
    const teamAccessPolicies = {
      ...(registryAccess?.TeamAccessPolicies || {}),
    };

    selected.forEach((access) => {
      const policies =
        access.Type === 'user' ? userAccessPolicies : teamAccessPolicies;
      if (action === 'delete') delete policies[access.Id];
      else
        policies[access.Id] = { RoleId: access.Role?.Id || RoleTypes.STANDARD };
    });

    updateMutation.mutate(
      {
        UserAccessPolicies: userAccessPolicies,
        TeamAccessPolicies: teamAccessPolicies,
      },
      {
        onSuccess: () => {
          notifySuccess('Success', 'Access successfully updated');
          onSuccess?.();
        },
      }
    );
  }
}

function RegistrySummary({
  registry,
  isLoading,
}: {
  registry?: { Name?: string; URL?: string };
  isLoading: boolean;
}) {
  return (
    <div className="mx-4 mb-4">
      <Widget>
        <WidgetTitle icon={Radio} title="Registry" />
        <WidgetBody loading={isLoading} className="!p-0">
          {registry && (
            <table className="mb-0 table">
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
    </div>
  );
}

function RegistryAccessManager({
  available,
  authorized,
  isLoading,
  isUpdating,
  onCreate,
  onRemove,
}: {
  available: Array<Option>;
  authorized: Array<Access>;
  isLoading: boolean;
  isUpdating: boolean;
  onCreate(selected: Array<Option>, onSuccess: () => void): void;
  onRemove(selected: Array<Access>): void;
}) {
  return (
    <>
      <div className="mx-4">
        <CreateAccessWidget
          availableUsersAndTeams={available}
          isLoading={isLoading}
          isUpdating={isUpdating}
          onSubmit={(selected, _roleId, onSuccess) =>
            onCreate(selected, onSuccess)
          }
          showRole={false}
          showWarning={false}
        />
      </div>
      <AccessDatatable
        tableKey="access_registry"
        dataset={authorized}
        onRemove={onRemove}
        onUpdate={() => undefined}
        isUpdatingAccess={isUpdating}
        isLoading={isLoading}
      />
    </>
  );
}

function useUpdateRegistryAccessMutation(
  environmentId: number,
  registryId: number
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      access: Parameters<typeof updateEnvironmentRegistryAccess>[2]
    ) => updateEnvironmentRegistryAccess(environmentId, registryId, access),
    onSuccess: () => queryClient.invalidateQueries(queryKeys.item(registryId)),
    ...withError('Unable to update accesses'),
  });
}
