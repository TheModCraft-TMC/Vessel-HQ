'use client';

import { HardDrive } from 'lucide-react';
import {
  PortainerEndpointGroup,
  PortainerTeamAccessPolicies,
  PortainerUserAccessPolicies,
} from '@api/types.gen';

import { Environment } from '@/domains/environments';
import { stripProtocol } from '@/react/common/string-utils';
import { AccessDatatable } from '@/react/portainer/access-control/AccessManagement/AccessDatatable/AccessDatatable';
import { CreateAccessWidget } from '@/react/portainer/access-control/AccessManagement/CreateAccessWidget';
import { Option } from '@/react/portainer/access-control/AccessManagement/PorAccessManagementUsersSelector';
import { useAccesses } from '@/react/portainer/access-control/AccessManagement/useAccesses';
import { useGroup } from '@/react/portainer/environments/environment-groups/queries/useGroup';
import { useEnvironment } from '@/react/portainer/environments/queries';
import { useUpdateEnvironmentMutation } from '@/react/portainer/environments/queries/useUpdateEnvironmentMutation';
import { Link } from '@/ui/components/links/Link';
import { notifySuccess } from '@/ui/components/toast/notifications';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';

export function EnvironmentAccessHeader({
  environmentId,
}: {
  environmentId: number;
}) {
  const environmentQuery = useEnvironment(environmentId);

  return (
    <PageHeader
      title="Environment access"
      breadcrumbs={[
        { label: 'Environments', link: '/environments' },
        {
          label: environmentQuery.data?.Name || 'Environment',
          link: '/environments/:id',
          linkParams: { id: environmentId },
        },
        'Access management',
      ]}
      reload
    />
  );
}

export function EnvironmentAccessContent({
  environmentId,
}: {
  environmentId: number;
}) {
  const environmentQuery = useEnvironment(environmentId);
  const environment = environmentQuery.data;
  const groupQuery = useGroup(environment?.GroupId, {
    enabled: Boolean(environment),
  });
  const group = groupQuery.data;
  const { availableUsersAndTeams, authorizedUsersAndTeams, isLoading } =
    useAccesses(environment, group);
  const createAccess = useUpdateEnvironmentMutation();
  const updateAccess = useUpdateEnvironmentMutation();

  return (
    <>
      <div className="mx-4 space-y-4">
        <EnvironmentAccessSummary
          environment={environment}
          group={group}
          isLoading={environmentQuery.isLoading || groupQuery.isLoading}
        />
        <CreateAccessWidget
          availableUsersAndTeams={availableUsersAndTeams as Option[]}
          isLoading={isLoading}
          isUpdating={createAccess.isLoading}
          onSubmit={(usersAndTeams, roleId, onSuccess) =>
            changePolicies(
              createAccess,
              usersAndTeams.map((access) => ({
                ...access,
                Role: { Id: roleId },
              })),
              'set',
              'Access successfully updated',
              onSuccess
            )
          }
        />
      </div>
      <AccessDatatable
        tableKey="access_endpoint"
        dataset={authorizedUsersAndTeams}
        onRemove={(accesses) =>
          changePolicies(
            updateAccess,
            accesses,
            'delete',
            'Access successfully removed'
          )
        }
        onUpdate={(users, teams) =>
          changePolicies(
            updateAccess,
            [...users, ...teams],
            'set',
            'Access successfully updated'
          )
        }
        showWarning
        showRoles
        inheritFrom
        isUpdateEnabled
        isUpdatingAccess={updateAccess.isLoading}
        isLoading={
          isLoading || environmentQuery.isLoading || groupQuery.isLoading
        }
      />
    </>
  );

  function changePolicies(
    mutation: ReturnType<typeof useUpdateEnvironmentMutation>,
    accesses: Array<{ Id: number; Type: string; Role?: { Id: number } }>,
    action: 'set' | 'delete',
    successMessage: string,
    onSuccess?: () => void
  ) {
    if (!environment) return;
    const userPolicies: PortainerUserAccessPolicies = {
      ...environment.UserAccessPolicies,
    };
    const teamPolicies: PortainerTeamAccessPolicies = {
      ...environment.TeamAccessPolicies,
    };

    accesses.forEach((access) => {
      const policies = access.Type === 'user' ? userPolicies : teamPolicies;
      if (action === 'delete') delete policies[access.Id];
      else policies[access.Id] = { RoleId: access.Role?.Id || 0 };
    });

    mutation.mutate(
      {
        id: environment.Id,
        payload: {
          UserAccessPolicies: userPolicies,
          TeamAccessPolicies: teamPolicies,
        },
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

function EnvironmentAccessSummary({
  environment,
  group,
  isLoading,
}: {
  environment: Environment | undefined;
  group: PortainerEndpointGroup | null | undefined;
  isLoading: boolean;
}) {
  return (
    <Widget>
      <WidgetTitle icon={HardDrive} title="Environment" />
      <WidgetBody loading={isLoading} className="!p-0">
        {environment && (
          <table className="mb-0 table">
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
                      to="/groups/:id"
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
  );
}
