'use client';

import { OverviewTab } from '@/domains/gitops/workflows/ItemView/OverviewTab';
import { WorkflowResourceHeader } from '@/domains/gitops/workflows/ItemView/WorkflowResourceHeader';
import { useWorkflow } from '@/domains/gitops/workflows/queries/useWorkflow';
import { Alert } from '@/ui/components/feedback/Alert';
import { PageHeader } from '@/ui/layouts/view-layout';

import { ResourceDetailHeaderSkeleton } from '@@/ResourceDetailHeader/ResourceDetailHeaderSkeleton';

export function WorkflowDetailsHeader({ workflowId }: { workflowId: number }) {
  const workflowQuery = useWorkflow(workflowId);

  return (
    <PageHeader
      breadcrumbs={[
        { label: 'GitOps Workflows', link: '/workflows' },
        workflowQuery.data?.name || 'Workflow',
      ]}
      reload={Boolean(workflowQuery.data)}
    />
  );
}

export function WorkflowDetailsContent({ workflowId }: { workflowId: number }) {
  const workflowQuery = useWorkflow(workflowId);

  if (workflowQuery.isLoading) {
    return <WorkflowLoading />;
  }

  if (!workflowQuery.data || workflowQuery.isError) {
    return <WorkflowError error={workflowQuery.error} />;
  }

  return (
    <div className="mx-4 space-y-4 pb-4">
        <WorkflowResourceHeader workflow={workflowQuery.data} />
        <OverviewTab workflow={workflowQuery.data} />
      </div>
  );
}

function WorkflowLoading() {
  return (
    <div className="mx-4 mb-4 space-y-4">
      <ResourceDetailHeaderSkeleton statBlockCount={1} />
    </div>
  );
}

function WorkflowError({ error }: { error: unknown }) {
  return (
    <div className="mx-4 mb-4 space-y-4">
      <Alert color="error">
        Failed loading workflow:{' '}
        {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    </div>
  );
}
