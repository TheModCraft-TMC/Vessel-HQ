import { useEnvironmentId } from '@/core/routing/useEnvironmentId';
import { StackType } from '@/domains/stacks';
import { useIsSwarmManager } from '@/core/composition/useDockerInfo';

export function useIsDeployable(type: StackType | undefined) {
  const environmentId = useEnvironmentId();

  // Swarm stacks deploy only from a manager; a worker deploys compose stacks.
  const isSwarmManager = useIsSwarmManager(environmentId);

  switch (type) {
    case StackType.DockerCompose:
      return !isSwarmManager;
    case StackType.DockerSwarm:
      return isSwarmManager;
    case StackType.Kubernetes:
    default:
      return false;
  }
}
