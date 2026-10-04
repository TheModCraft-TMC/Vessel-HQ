import _ from 'lodash';

import { ResourceControlViewModel } from '@/react/portainer/access-control/models/ResourceControlViewModel';
import { useIsStandalone } from '@/domains/containers/hooks/useDockerSystem';
import { Environment } from '@/domains/environments';
import type { DockerContainerDto } from '@/providers/infrastructure/docker';

import { ContainerListViewModel, ContainerStatus } from './types';

type ResourceControlResponse = ConstructorParameters<
  typeof ResourceControlViewModel
>[0];

/**
 * Transform an item of the raw docker container list reponse to a container list view model
 * @param response Raw docker container list reponse item
 * @returns ContainerListViewModel
 */
export function toListViewModel(
  response: DockerContainerDto
): ContainerListViewModel {
  const resourceControlData = response.Portainer?.ResourceControl;
  const resourceControl = isResourceControlResponse(resourceControlData)
    ? new ResourceControlViewModel(resourceControlData)
    : undefined;
  const nodeName = response.Portainer?.Agent?.NodeName || '';

  const ip =
    Object.values(response?.NetworkSettings?.Networks || {})[0]?.IPAddress ||
    '';

  const labels = response.Labels || {};
  const stackName =
    labels['com.docker.compose.project'] ||
    labels['com.docker.stack.namespace'];

  const status = createStatus(response.State, response.Status);

  const ports = _.compact(
    response.Ports?.map(
      (p) =>
        p.PublicPort && {
          host: p.IP,
          private: p.PrivatePort,
          public: p.PublicPort,
        }
    )
  );

  let names = response.Names?.map((n) => {
    const nameWithoutSlash = n[0] === '/' ? n.slice(1) : n;
    return nameWithoutSlash;
  });

  if (!names || names.length === 0) {
    names = ['<empty_name>'];
  }

  return {
    ...response,
    ResourceControl: resourceControl,
    Names: names,
    NodeName: nodeName,
    IP: ip,
    StackName: stackName,
    Status: status,
    Ports: ports,
    StatusText: response.Status,
    Gpus: '',
  };
}

function isResourceControlResponse(
  value: unknown
): value is ResourceControlResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const data = value as Record<string, unknown>;
  return (
    typeof data.Id === 'number' &&
    typeof data.Type === 'number' &&
    (typeof data.ResourceId === 'number' ||
      typeof data.ResourceId === 'string') &&
    Array.isArray(data.UserAccesses) &&
    Array.isArray(data.TeamAccesses) &&
    typeof data.Public === 'boolean' &&
    typeof data.AdministratorsOnly === 'boolean' &&
    typeof data.System === 'boolean'
  );
}

function createStatus(state = '', statusText = ''): ContainerStatus {
  const statusLower = statusText.toLowerCase();

  // Health check status is only present in the human-readable Status field, not in State
  if (statusLower.includes('(healthy)')) {
    return ContainerStatus.Healthy;
  }

  if (statusLower.includes('(unhealthy)')) {
    return ContainerStatus.Unhealthy;
  }

  if (statusLower.includes('(health: starting)')) {
    return ContainerStatus.Starting;
  }

  // Use the standardized State field for all other states
  switch (state.toLowerCase()) {
    case ContainerStatus.Paused:
      return ContainerStatus.Paused;
    case ContainerStatus.Dead:
      return ContainerStatus.Dead;
    case ContainerStatus.Created:
      return ContainerStatus.Created;
    case ContainerStatus.Exited:
      return ContainerStatus.Exited;
    case ContainerStatus.Restarting:
      return ContainerStatus.Restarting;
    case ContainerStatus.Removing:
      return ContainerStatus.Removing;
    default:
      return ContainerStatus.Running;
  }
}

export function useShowGPUsColumn(environment: Environment | undefined) {
  const isDockerStandalone = useIsStandalone(environment?.Id);
  const enableGPUManagement = !!environment?.EnableGPUManagement;
  return isDockerStandalone && enableGPUManagement;
}

export function trimContainerName(name?: string) {
  return name?.startsWith('/') ? name.slice(1) : name || '';
}

export function joinCommand(command: string[] | null = []) {
  return command?.join(' ') || '';
}

export function isPartOfSwarmService(container: {
  Config?: { Labels?: Record<string, unknown> };
}) {
  return !!container.Config?.Labels?.['com.docker.swarm.service.id'];
}
