import _ from 'lodash';

import { useEdgeGroups } from '@/domains/edge/queries/edge-groups/useEdgeGroups';
import { EnvironmentType } from '@/domains/environments';
import { DeploymentType, EdgeStack } from '@/domains/edge/models/edge-stack';

export function useAllowKubeToSelectCompose(edgeStack: EdgeStack) {
  const edgeGroupsQuery = useEdgeGroups();

  const initiallyContainsKubeEnv = _.compact(
    edgeStack.EdgeGroups.map((id) =>
      edgeGroupsQuery.data?.find((e) => e.Id === id)
    )
  )
    .flatMap((group) => group.EndpointTypes)
    .includes(EnvironmentType.EdgeAgentOnKubernetes);

  return (
    initiallyContainsKubeEnv &&
    edgeStack.DeploymentType === DeploymentType.Compose
  );
}
