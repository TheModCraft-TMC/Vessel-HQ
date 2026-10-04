import { WorkflowsContent } from '@console/console/pages/WorkflowsPage';

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
