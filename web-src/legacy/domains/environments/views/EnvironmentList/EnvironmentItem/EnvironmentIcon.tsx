import { getEnvironmentTypeIcon } from '@/react/portainer/environments/utils';
import dockerEdge from '@/assets/ico/docker-edge-environment.svg';
import podmanEdge from '@/assets/ico/podman-edge-environment.svg';
import kube from '@/assets/images/kubernetes_endpoint.png';
import kubeEdge from '@/assets/ico/kubernetes-edge-environment.svg';
import { ContainerEngine, EnvironmentType } from '@/domains/environments';
import azure from '@/assets/ico/vendor/azure.svg';
import docker from '@/assets/ico/vendor/docker.svg';
import podman from '@/assets/ico/vendor/podman.svg';
import { Icon } from '@/ui/components/icons/Icon';

interface Props {
  type: EnvironmentType;
  containerEngine?: ContainerEngine;
}

export function assetUrl(asset: string | { src: string }) {
  return typeof asset === 'string' ? asset : asset.src;
}

export function EnvironmentIcon({ type, containerEngine }: Props) {
  switch (type) {
    case EnvironmentType.AgentOnDocker:
    case EnvironmentType.Docker:
      if (containerEngine === ContainerEngine.Podman) {
        return (
          <img
            src={assetUrl(podman)}
            width="60"
            alt="podman environment"
            aria-hidden="true"
          />
        );
      }
      return (
        <img
          src={assetUrl(docker)}
          width="60"
          alt="docker environment"
          aria-hidden="true"
        />
      );
    case EnvironmentType.Azure:
      return (
        <img
          src={assetUrl(azure)}
          width="60"
          alt="azure environment"
          aria-hidden="true"
        />
      );
    case EnvironmentType.EdgeAgentOnDocker:
      if (containerEngine === ContainerEngine.Podman) {
        return (
          <img
            src={assetUrl(podmanEdge)}
            alt="podman edge environment"
            aria-hidden="true"
          />
        );
      }
      return (
        <img
          src={assetUrl(dockerEdge)}
          alt="docker edge environment"
          aria-hidden="true"
        />
      );
    case EnvironmentType.KubernetesLocal:
    case EnvironmentType.AgentOnKubernetes:
      return (
        <img
          src={assetUrl(kube)}
          alt="kubernetes environment"
          aria-hidden="true"
        />
      );
    case EnvironmentType.EdgeAgentOnKubernetes:
      return (
        <img
          src={assetUrl(kubeEdge)}
          alt="kubernetes edge environment"
          aria-hidden="true"
        />
      );
    default:
      return (
        <Icon
          icon={getEnvironmentTypeIcon(type, containerEngine)}
          className="blue-icon !h-16 !w-16"
        />
      );
  }
}
