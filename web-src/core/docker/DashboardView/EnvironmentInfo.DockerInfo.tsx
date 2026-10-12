import { ZapIcon } from 'lucide-react';

import { useEnvironmentId } from '@/core/routing/useEnvironmentId';
import { getDockerEnvironmentType } from '@/domains/environments';
import { usePodmanCapabilities } from '@/providers/infrastructure/podman';
import { Icon } from '@/ui/components/icons/Icon';
import { useInfo } from '@/core/composition/useDockerInfo';

export function DockerInfo({ isAgent }: { isAgent: boolean }) {
  const envId = useEnvironmentId();
  const infoQuery = useInfo(envId);
  const podmanCapabilities = usePodmanCapabilities(envId);

  if (!infoQuery.data) {
    return null;
  }

  const info = infoQuery.data;

  const isSwarm = info.Swarm !== undefined && info.Swarm?.NodeID !== '';
  const type = getDockerEnvironmentType(
    isSwarm,
    podmanCapabilities.engine === 'podman'
  );

  return (
    <span className="small text-muted inline-flex gap-x-2">
      <span>
        {type} {info.ServerVersion}
      </span>
      {isAgent && (
        <>
          <span>-</span>
          <span className="inline-flex items-center">
            <Icon icon={ZapIcon} />
            Agent
          </span>
        </>
      )}
    </span>
  );
}
