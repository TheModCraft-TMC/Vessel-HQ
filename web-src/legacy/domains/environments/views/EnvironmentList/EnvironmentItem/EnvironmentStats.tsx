import { Environment, PlatformType } from '@/domains/environments';
import { getPlatformType } from '@/domains/environments/utils';

import { EnvironmentStatsDocker } from './EnvironmentStatsDocker';
import { EnvironmentStatsKubernetes } from './EnvironmentStatsKubernetes';

interface Props {
  environment: Environment;
}

export function EnvironmentStats({ environment }: Props) {
  const platform = getPlatformType(environment.Type);

  const component = getComponent(platform, environment);

  return (
    <span className="blocklist-item-desc flex w-full flex-wrap items-center gap-x-4 gap-y-2 lg:ml-auto lg:w-auto lg:shrink-0 lg:justify-end lg:gap-x-10">
      {component}
    </span>
  );
}

function getComponent(platform: PlatformType, environment: Environment) {
  switch (platform) {
    case PlatformType.Kubernetes:
      return (
        <EnvironmentStatsKubernetes
          snapshot={environment.Kubernetes.Snapshots?.[0]}
        />
      );
    case PlatformType.Docker:
    case PlatformType.Podman:
      return <EnvironmentStatsDocker snapshot={environment.Snapshots?.[0]} />;
    case PlatformType.Azure:
      return null;
  }
}
