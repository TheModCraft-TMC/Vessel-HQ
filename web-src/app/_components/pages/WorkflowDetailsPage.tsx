'use client';

import { PageContent } from '@console/layout/PageContent';

import { OverviewTab } from '@/domains/gitops/workflows/ItemView/OverviewTab';
import { WorkflowResourceHeader } from '@/domains/gitops/workflows/ItemView/WorkflowResourceHeader';
import { useWorkflow } from '@/domains/gitops/workflows/queries/useWorkflow';
import { Alert } from '@/ui/components/feedback/Alert';
import { PageHeader } from '@/ui/layouts/view-layout';
import { ResourceDetailHeaderSkeleton } from '@/ui/components/ResourceDetailHeader/ResourceDetailHeaderSkeleton';

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
    <PageContent>
      <WorkflowResourceHeader workflow={workflowQuery.data} />
      <OverviewTab workflow={workflowQuery.data} />
    </PageContent>
  );
}

function WorkflowLoading() {
  return (
    <PageContent>
      <ResourceDetailHeaderSkeleton statBlockCount={1} />
    </PageContent>
  );
}

function WorkflowError({ error }: { error: unknown }) {
  return (
    <PageContent>
      <Alert color="error">
        Failed loading workflow:{' '}
        {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    </PageContent>
  );
}
