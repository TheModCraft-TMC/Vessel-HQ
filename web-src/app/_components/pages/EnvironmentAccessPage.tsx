'use client';

import { HardDrive } from 'lucide-react';
import {
  PortainerEndpointGroup,
  PortainerTeamAccessPolicies,
  PortainerUserAccessPolicies,
} from '@api/types.gen';
import { Link } from '@console/navigation/Link';
import { PageContent } from '@console/layout/PageContent';

import { Environment } from '@/domains/environments';
import { stripProtocol } from '@/shared/strings';
import { AccessDatatable } from '@/core/access-control/AccessManagement/AccessDatatable/AccessDatatable';
import { CreateAccessWidget } from '@/core/access-control/AccessManagement/CreateAccessWidget';
import { Option } from '@/core/access-control/AccessManagement/PorAccessManagementUsersSelector';
import { useAccesses } from '@/core/access-control/AccessManagement/useAccesses';
import { useGroup } from '@/domains/environments/queries/useGroup';
import { useEnvironment } from '@/domains/environments';
import { useUpdateEnvironmentMutation } from '@/core/environment-management/environments/queries/useUpdateEnvironmentMutation';
import { notifySuccess } from '@/ui/components/toast/notifications';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';
import { Widget, WidgetBody, WidgetTitle } from '@/ui/components/Widget';

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
      <PageContent>
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
      </PageContent>
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
                <th scope="row" className="text-left font-normal">
                  Name
                </th>
                <td>{environment.Name}</td>
              </tr>
              <tr>
                <th scope="row" className="text-left font-normal">
                  URL
                </th>
                <td>{stripProtocol(environment.URL)}</td>
              </tr>
              <tr>
                <th scope="row" className="text-left font-normal">
                  Group
                </th>
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
