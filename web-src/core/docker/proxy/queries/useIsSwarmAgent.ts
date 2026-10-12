import { useEnvironmentId } from '@/core/routing/useEnvironmentId';
import { useCurrentEnvironment } from '@/core/composition/useCurrentEnvironment';
import { isAgentEnvironment } from '@/domains/environments';
import { useIsSwarm } from '@/core/composition/useDockerInfo';

export function useIsSwarmAgent() {
  const envId = useEnvironmentId();
  const isSwarm = useIsSwarm(envId);
  const envQuery = useCurrentEnvironment();

  if (!envQuery.isSuccess) {
    return false;
  }

  return isSwarm && isAgentEnvironment(envQuery.data.Type);
}
