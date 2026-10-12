import { useEnvironmentId } from '@/core/routing/useEnvironmentId';
import { TemplateType } from '@/domains/templates';
import { useIsSwarmManager } from '@/core/composition/useDockerInfo';

export function useIsDeployable(type: TemplateType) {
  const environmentId = useEnvironmentId();

  // Swarm stacks can only be deployed from a manager node, not a worker.
  const isSwarmManager = useIsSwarmManager(environmentId);

  switch (type) {
    case TemplateType.ComposeStack:
    case TemplateType.Container:
      return true;
    case TemplateType.SwarmStack:
      return isSwarmManager;
    default:
      return false;
  }
}
