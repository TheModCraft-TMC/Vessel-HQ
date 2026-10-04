import { PageHeader } from '@/ui/layouts/view-layout/page-header';
import { AddButton } from '@/ui/components/buttons';

import { EnvironmentGroupsTable } from './EnvironmentGroupsTable/EnvironmentGroupsTable';

export function ListView() {
  return (
    <>
      <PageHeader
        title="Environment Groups"
        breadcrumbs="Environment group management"
        reload
      >
        <AddButton to="./new" data-cy="add-environment-group-button">
          Add group
        </AddButton>
      </PageHeader>

      <div className="mx-5 mb-5">
        <EnvironmentGroupsTable />
      </div>
    </>
  );
}
