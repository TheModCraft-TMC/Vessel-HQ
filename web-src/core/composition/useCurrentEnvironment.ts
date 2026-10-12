import { useEnvironment } from '@/domains/environments';
import { useEnvironmentId } from '@/core/routing/useEnvironmentId';

export function useCurrentEnvironment(force = true) {
  const id = useEnvironmentId(force);
  return useEnvironment(id, undefined, { excludeSnapshot: false });
}
