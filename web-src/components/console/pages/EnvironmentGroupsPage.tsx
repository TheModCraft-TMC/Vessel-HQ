'use client';

import { EnvironmentGroupsTable } from '@/react/portainer/environments/environment-groups/ListView/EnvironmentGroupsTable/EnvironmentGroupsTable';

export function EnvironmentGroupsContent() {
  return (
    <div className="mx-5 mb-5">
      <EnvironmentGroupsTable />
    </div>
  );
}
