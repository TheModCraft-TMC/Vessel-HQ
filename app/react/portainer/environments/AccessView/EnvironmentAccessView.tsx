import { HardDrive } from 'lucide-react';

import {
  PortainerTeamAccessPolicies,
  PortainerUserAccessPolicies,
} from '@api/types.gen';

import { notifySuccess } from '@/ui/components/toast/notifications';
import { stripProtocol } from '@/react/common/string-utils';
import { useIdParam } from '@/react/hooks/useIdParam';
import { AccessDatatable } from '@/react/portainer/access-control/AccessManagement/AccessDatatable/AccessDatatable';
import { Access } from '@/react/portainer/access-control/AccessManagement/AccessDatatable/types';
import { CreateAccessWidget } from '@/react/portainer/access-control/AccessManagement/CreateAccessWidget';
import { Option } from '@/react/portainer/access-control/AccessManagement/PorAccessManagementUsersSelector';
import { useAccesses } from '@/react/portainer/access-control/AccessManagement/useAccesses';
import { Link } from '@/ui/components/links/Link';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';

import { useGroup } from '../environment-groups/queries/useGroup';
import { useEnvironment } from '../queries';
import { useUpdateEnvironmentMutation } from '../queries/useUpdateEnvironmentMutation';

export function EnvironmentAccessView() {
  const environmentId = useIdParam();
  const environmentQuery = useEnvironment(environmentId);
  const environment = environmentQuery.data;
  const groupQuery = useGroup(environment?.GroupId, {
    enabled: !!environment,
  });
  const group = groupQuery.data;
  const { availableUsersAndTeams, authorizedUsersAndTeams, isLoading } =
    useAccesses(environment, group);
  const createMutation = useUpdateEnvironmentMutation();
  const datatableMutation = useUpdateEnvironmentMutation();

  return (
    <>
      <PageHeader
        title="Environment access"
        breadcrumbs={[
          { label: 'Environments', link: 'portainer.endpoints' },
          {
            label: environment?.Name || 'Environment',
            link: 'portainer.endpoints.endpoint',
            linkParams: { id: environmentId },
          },
          'Access management',
        ]}
        reload
      />

      <div className="mx-4 space-y-4">
        <Widget>
          <WidgetTitle icon={HardDrive} title="Environment" />
          <WidgetBody
            loading={environmentQuery.isLoading || groupQuery.isLoading}
            className="!p-0"
          >
            {environment && (
              <table className="table mb-0">
                <tbody>
                  <tr>
                    <td>Name</td>
                    <td>{environment.Name}</td>
                  </tr>
                  <tr>
                    <td>URL</td>
                    <td>{stripProtocol(environment.URL)}</td>
                  </tr>
                  <tr>
                    <td>Group</td>
                    <td>
                      {group ? (
                        <Link
                          to="portainer.groups.group"
                          params={{ id: group.Id }}
                          data-cy="environment-group-link"
                        >
                          {group.Name}
                        </Link>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </WidgetBody>
        </Widget>

        <CreateAccessWidget
          availableUsersAndTeams={availableUsersAndTeams as Array<Option>}
          isLoading={isLoading}
          isUpdating={createMutation.isLoading}
          onSubmit={handleCreate}
        />
      </div>

      <AccessDatatable
        tableKey="access_endpoint"
        dataset={authorizedUsersAndTeams}
        onRemove={handleRemove}
        onUpdate={handleUpdate}
        showWarning
        showRoles
        inheritFrom
        isUpdateEnabled
        isUpdatingAccess={datatableMutation.isLoading}
        isLoading={
          isLoading || environmentQuery.isLoading || groupQuery.isLoading
        }
      />
    </>
  );

  function handleCreate(
    usersAndTeams: Array<Option>,
    roleId: number,
    onSuccess: () => void
  ) {
    updatePolicies(
      createMutation,
      usersAndTeams.map((access) => ({ ...access, Role: { Id: roleId } })),
      'set',
      'Access successfully updated',
      onSuccess
    );
  }

  function handleUpdate(
    updatedUsers: Array<Access>,
    updatedTeams: Array<Access>
  ) {
    updatePolicies(
      datatableMutation,
      [...updatedUsers, ...updatedTeams],
      'set',
      'Access successfully updated'
    );
  }

  function handleRemove(accesses: Array<Access>) {
    updatePolicies(
      datatableMutation,
      accesses,
      'delete',
      'Access successfully removed'
    );
  }

  function updatePolicies(
    mutation: ReturnType<typeof useUpdateEnvironmentMutation>,
    accesses: Array<{ Id: number; Type: string; Role?: { Id: number } }>,
    action: 'set' | 'delete',
    successMessage: string,
    onSuccess?: () => void
  ) {
    if (!environment) {
      return;
    }

    const userAccessPolicies: PortainerUserAccessPolicies = {
      ...environment.UserAccessPolicies,
    };
    const teamAccessPolicies: PortainerTeamAccessPolicies = {
      ...environment.TeamAccessPolicies,
    };

    accesses.forEach((access) => {
      const policies =
        access.Type === 'user' ? userAccessPolicies : teamAccessPolicies;

      if (action === 'delete') {
        delete policies[access.Id];
      } else {
        policies[access.Id] = { RoleId: access.Role?.Id || 0 };
      }
    });

    mutation.mutate(
      {
        id: environment.Id,
        payload: { UserAccessPolicies: userAccessPolicies, TeamAccessPolicies: teamAccessPolicies },
      },
      {
        onSuccess: () => {
          notifySuccess('Success', successMessage);
          onSuccess?.();
        },
      }
    );
  }
}
