'use client';

import { useState } from 'react';
import { UserX } from 'lucide-react';

import { UserId, useUsers } from '@/domains/users';
import { EffectiveAccessViewer } from '@/domains/users/RolesView/AccessViewer/EffectiveAccessViewer';
import { RbacRolesDatatable } from '@/domains/users/RolesView/RbacRolesDatatable';
import { PortainerSelect } from '@/ui/components/forms/PortainerSelect';

import { Widget } from '@@/Widget';

export function RolesContent() {
  return (
    <div className="space-y-4">
      <RbacRolesDatatable />
      <EffectiveAccessPanel />
    </div>
  );
}

function EffectiveAccessPanel() {
  const usersQuery = useUsers();
  const [selectedUserId, setSelectedUserId] = useState<UserId | null>(null);
  const userOptions =
    usersQuery.data?.map((user) => ({
      label: user.Username,
      value: user.Id,
    })) ?? [];

  return (
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
  );
}
