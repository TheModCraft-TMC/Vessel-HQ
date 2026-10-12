import { PageContent } from '@console/layout/PageContent';

import { useIdParam } from '@/core/hooks/useIdParam';
import { PageHeader } from '@/ui/layouts/view-layout';
import { Alert } from '@/ui/components/feedback/Alert';
import { ResourceDetailHeaderSkeleton } from '@/ui/components/ResourceDetailHeader/ResourceDetailHeaderSkeleton';

import { useWorkflow } from '../queries/useWorkflow';
import { Workflow } from '../types';

import { WorkflowResourceHeader } from './WorkflowResourceHeader';
import { OverviewTab } from './OverviewTab';

const breadcrumbs = [
  { label: 'GitOps Workflows', link: '/workflows' },
  'Workflow',
];

export function ItemView() {
  const workflowId = useIdParam('workflowId');

  const workflowQuery = useWorkflow(workflowId);
  const workflow = workflowQuery.data;

  if (workflowQuery.isLoading) {
    return (
      <>
        <PageHeader breadcrumbs={breadcrumbs} />
        <PageContent>
          <ResourceDetailHeaderSkeleton statBlockCount={1} />
        </PageContent>
      </>
    );
  }

  if (!workflow || workflowQuery.isError) {
    const error = workflowQuery.error;

    return (
      <>
        <PageHeader breadcrumbs={breadcrumbs} />
        <PageContent>
          <Alert color="error">
            Failed loading workflow:{' '}
            {error instanceof Error ? error.message : 'Unknown error'}
          </Alert>
        </PageContent>
      </>
    );
  }

  return <WorkflowContent workflow={workflow} />;
}

function WorkflowContent({ workflow }: { workflow: Workflow }) {
  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'GitOps Workflows', link: '/workflows' },
          workflow.name,
        ]}
        reload
      />
      <PageContent>
        <WorkflowResourceHeader workflow={workflow} />
        <OverviewTab workflow={workflow} />
      </PageContent>
    </>
  );
}
