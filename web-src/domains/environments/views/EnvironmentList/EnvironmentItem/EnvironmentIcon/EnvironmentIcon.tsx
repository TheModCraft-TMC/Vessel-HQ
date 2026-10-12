import { getEnvironmentTypeIcon } from '@/domains/environments/utils';
import dockerEdge from '@/shared/assets/ico/docker-edge-environment.svg';
import podmanEdge from '@/shared/assets/ico/podman-edge-environment.svg';
import kube from '@/shared/assets/images/kubernetes_endpoint.png';
import kubeEdge from '@/shared/assets/ico/kubernetes-edge-environment.svg';
import { ContainerEngine, EnvironmentType } from '@/domains/environments';
import azure from '@/shared/assets/ico/vendor/azure.svg';
import docker from '@/shared/assets/ico/vendor/docker.svg';
import podman from '@/shared/assets/ico/vendor/podman.svg';
import { Icon } from '@/ui/components/icons/Icon';

import styles from './EnvironmentIcon.module.css';

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
            className={styles.root}
            src={assetUrl(podman)}
            width="60"
            alt="podman environment"
            aria-hidden="true"
          />
        );
      }
      return (
        <img
          className={styles.root}
          src={assetUrl(docker)}
          width="60"
          alt="docker environment"
          aria-hidden="true"
        />
      );
    case EnvironmentType.Azure:
      return (
        <img
          className={styles.root}
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
            className={styles.root}
            src={assetUrl(podmanEdge)}
            alt="podman edge environment"
            aria-hidden="true"
          />
        );
      }
      return (
        <img
          className={styles.root}
          src={assetUrl(dockerEdge)}
          alt="docker edge environment"
          aria-hidden="true"
        />
      );
    case EnvironmentType.KubernetesLocal:
    case EnvironmentType.AgentOnKubernetes:
      return (
        <img
          className={styles.root}
          src={assetUrl(kube)}
          alt="kubernetes environment"
          aria-hidden="true"
        />
      );
    case EnvironmentType.EdgeAgentOnKubernetes:
      return (
        <img
          className={styles.root}
          src={assetUrl(kubeEdge)}
          alt="kubernetes edge environment"
          aria-hidden="true"
        />
      );
    default:
      return (
        <Icon
          icon={getEnvironmentTypeIcon(type, containerEngine)}
          className={`${styles.root} blue-icon !h-16 !w-16`}
        />
      );
  }
}
