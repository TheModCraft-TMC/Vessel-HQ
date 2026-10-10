import { EnvironmentGroupsContent } from '@app/_components/pages/EnvironmentGroupsPage';
import { AddButton } from '@/ui/components/buttons';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

export default function GroupsPage() {
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
      <EnvironmentGroupsContent />
    </>
  );
}
