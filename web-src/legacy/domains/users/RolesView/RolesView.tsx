import { useState } from 'react';
import { UserX } from 'lucide-react';

import { useUsers } from '@/domains/users';
import { UserId } from '@/domains/users';
import { PageHeader } from '@/ui/layouts/view-layout';
import { PortainerSelect } from '@/ui/components/forms/PortainerSelect';

import { Widget } from '@@/Widget';

import { EffectiveAccessViewer } from './AccessViewer/EffectiveAccessViewer';
import { RbacRolesDatatable } from './RbacRolesDatatable';

export function RolesView() {
  const usersQuery = useUsers();
  const [selectedUserId, setSelectedUserId] = useState<UserId | null>(null);
  const userOptions =
    usersQuery.data?.map((user) => ({
      label: user.Username,
      value: user.Id,
    })) ?? [];

  return (
    <>
      <PageHeader title="Roles" breadcrumbs="Role management" reload />

      <div className="space-y-4">
        <RbacRolesDatatable />

        <Widget className="mx-4">
          <Widget.Title icon={UserX} title="Effective access viewer" />
          <Widget.Body>
            <div className="form-horizontal">
              <div className="form-section-title">User</div>
              <div className="form-group">
                <div className="col-sm-12">
                  {userOptions.length ? (
                    <PortainerSelect
                      value={selectedUserId}
                      options={userOptions}
                      onChange={setSelectedUserId}
                      placeholder="Select a user"
                      data-cy="effective-access-user-select"
                    />
                  ) : (
                    <span className="text-muted small">No user available</span>
                  )}
                </div>
              </div>
              <EffectiveAccessViewer userId={selectedUserId} />
            </div>
          </Widget.Body>
        </Widget>
      </div>
    </>
  );
}
