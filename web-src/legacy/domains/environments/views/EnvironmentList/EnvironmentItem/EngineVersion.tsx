import {
  DockerSnapshot,
  Environment,
  PlatformType,
  KubernetesSnapshot,
} from '@/domains/environments';
import { getPodmanCapabilities } from '@/providers/infrastructure/podman';
import {
  getDockerEnvironmentType,
  getPlatformType,
} from '@/domains/environments/utils';

export function EngineVersion({ environment }: { environment: Environment }) {
  const platform = getPlatformType(environment.Type);
  const podmanCapabilities = getPodmanCapabilities(environment);

  switch (platform) {
    case PlatformType.Docker:
      return (
        <DockerEngineVersion
          snapshot={environment.Snapshots[0]}
          podmanEngine={podmanCapabilities.engine === 'podman'}
        />
      );
    case PlatformType.Kubernetes:
      return (
        <KubernetesEngineVersion
          snapshot={environment.Kubernetes.Snapshots?.[0]}
        />
      );
    default:
      return null;
  }
}

function DockerEngineVersion({
  snapshot,
  podmanEngine,
}: {
  snapshot?: DockerSnapshot;
  podmanEngine?: boolean;
}) {
  if (!snapshot) {
    return null;
  }
  const type = getDockerEnvironmentType(snapshot.Swarm, podmanEngine);

  return (
    <span className="small text-muted vertical-center">
      {type} {snapshot.DockerVersion}
    </span>
  );
}

function KubernetesEngineVersion({
  snapshot,
}: {
  snapshot?: KubernetesSnapshot;
}) {
  if (!snapshot) {
    return null;
  }

  return (
    <span className="small text-muted vertical-center">
      Kubernetes {snapshot.KubernetesVersion}
    </span>
  );
}
