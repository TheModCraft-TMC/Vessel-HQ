import { SourcesContent } from '@app/_components/pages/SourcesPage';
import { AddButton } from '@/ui/components/buttons';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function SourcesPage() {
  return (
    <>
      <PageHeader title="GitOps Sources" breadcrumbs="GitOps Sources" reload>
        <div className="ml-auto">
          <AddButton to="./new" data-cy="add-source-button">
            Add new
          </AddButton>
        </div>
      </PageHeader>
      <SourcesContent />
    </>
  );
}
