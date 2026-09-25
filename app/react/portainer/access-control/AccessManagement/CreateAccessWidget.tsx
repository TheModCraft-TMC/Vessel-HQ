import { useState } from 'react';
import { UserPlus, Plus } from 'lucide-react';

import { RoleTypes } from '@/portainer/rbac/models/role';
import { useRbacRoles } from '@/domains/users/RolesView/useRbacRoles';

import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';
import { LoadingButton } from '@/ui/components/buttons';
import { FormControl } from '@/ui/components/forms/FormControl';
import { PortainerSelect } from '@/ui/components/forms/PortainerSelect';

import {
  Option,
  PorAccessManagementUsersSelector,
} from './PorAccessManagementUsersSelector';

interface Props {
  availableUsersAndTeams: Array<Option>;
  isLoading: boolean;
  isUpdating: boolean;
  onSubmit(
    usersAndTeams: Array<Option>,
    roleId: number,
    onSuccess: () => void
  ): void;
  showRole?: boolean;
  showWarning?: boolean;
}

export function CreateAccessWidget({
  availableUsersAndTeams,
  isLoading,
  isUpdating,
  onSubmit,
  showRole = true,
  showWarning = true,
}: Props) {
  const [selectedUsersAndTeams, setSelectedUsersAndTeams] = useState<
    Array<Option>
  >([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number>(
    RoleTypes.STANDARD
  );

  const rolesQuery = useRbacRoles();
  const roleOptions = (rolesQuery.data || []).map((role) => ({
    label: role.Name,
    value: role.Id,
  }));

  return (
    <Widget aria-label="Create access">
      <WidgetTitle icon={UserPlus} title="Create access" />
      <WidgetBody>
        {showWarning && (
          <TextTip className="mb-4" childrenWrapperClassName="text-warning">
            Adding user access will require the affected user(s) to logout and
            login for the changes to be taken into account.
          </TextTip>
        )}

        <form className="form-horizontal" onSubmit={handleSubmit}>
          <PorAccessManagementUsersSelector
            className="mb-6"
            options={availableUsersAndTeams}
            value={selectedUsersAndTeams}
            onChange={(value) => setSelectedUsersAndTeams([...value])}
            isLoading={isLoading}
          />

          {showRole && (
            <FormControl label="Role" inputId="role-selector">
              <PortainerSelect
                inputId="role-selector"
                value={selectedRoleId}
                onChange={(roleId) =>
                  setSelectedRoleId(roleId ?? RoleTypes.STANDARD)
                }
                options={roleOptions}
                disabled={rolesQuery.isLoading}
                data-cy="access-management-role-select"
              />
            </FormControl>
          )}

          <div className="form-group">
            <div className="col-sm-12">
              <LoadingButton
                type="submit"
                className="!ml-0"
                disabled={selectedUsersAndTeams.length === 0}
                isLoading={isUpdating}
                loadingText="Creating access..."
                icon={Plus}
                data-cy="access-createAccess"
              >
                Create access
              </LoadingButton>
            </div>
          </div>
        </form>
      </WidgetBody>
    </Widget>
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(selectedUsersAndTeams, selectedRoleId, () =>
      setSelectedUsersAndTeams([])
    );
  }
}
