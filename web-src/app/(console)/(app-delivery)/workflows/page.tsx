import { WorkflowsContent } from '@app/_components/pages/WorkflowsPage';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function WorkflowsPage() {
  return (
    <>
      <PageHeader
        title="GitOps Workflows"
        breadcrumbs="GitOps Workflows"
        reload
      />
      <WorkflowsContent />
    </>
  );
}
