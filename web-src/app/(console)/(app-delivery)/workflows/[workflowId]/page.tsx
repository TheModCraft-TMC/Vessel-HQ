import { notFound } from 'next/navigation';
import {
  WorkflowDetailsContent,
  WorkflowDetailsHeader,
} from '@console/console/pages/WorkflowDetailsPage';

export default async function WorkflowPage({
  params,
}: {
  params: Promise<{ workflowId: string }>;
}) {
  const { workflowId: value } = await params;
  const workflowId = Number(value);
  if (!Number.isInteger(workflowId) || workflowId < 1) notFound();

  return (
    <>
      <WorkflowDetailsHeader workflowId={workflowId} />
      <WorkflowDetailsContent workflowId={workflowId} />
    </>
  );
}
