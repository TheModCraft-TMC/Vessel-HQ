'use client';

import { PageContent } from '@console/layout/PageContent';

import { EnvironmentGroupsTable } from '@/core/environment-management/environment-groups/ListView/EnvironmentGroupsTable/EnvironmentGroupsTable';

export function EnvironmentGroupsContent() {
  return (
    <PageContent>
      <EnvironmentGroupsTable />
    </PageContent>
  );
}
