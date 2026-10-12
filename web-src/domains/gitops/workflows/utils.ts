import { StackType } from '@/domains/stacks';

import { DeploymentPlatform, WorkflowType } from './types';

export function getWorkflowLink(item: { id: number }): {
  to: string;
  params: object;
} {
  return {
    to: '/workflows/:workflowId',
    params: { workflowId: item.id },
  };
}

export function getSourceLink(sourceId: number): {
  to: string;
  params: object;
} {
  return {
    to: '/sources/:sourceId',
    params: { sourceId },
  };
}

interface DeployedStack {
  id: number;
  name: string;
  type: WorkflowType;
  platform?: DeploymentPlatform;
  target?: { endpointId?: number };
}

/** Links to the actual deployed Stack/EdgeStack a Workflow or WorkflowArtifact represents. */
export function getDeployedStackLink(
  item: DeployedStack
): { to: string; params: object } | null {
  if (item.type === 'edgeStack') {
    return { to: '/edge/stacks/:stackId', params: { stackId: item.id } };
  }

  if (item.platform === 'kubernetes') {
    return null;
  }

  const type =
    item.platform === 'dockerSwarm'
      ? StackType.DockerSwarm
      : StackType.DockerCompose;

  return {
    to: '/:endpointId/docker/stacks/:name',
    params: {
      endpointId: item.target?.endpointId,
      name: item.name,
      id: item.id,
      type,
      regular: true,
    },
  };
}
