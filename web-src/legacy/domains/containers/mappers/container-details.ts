import type { DockerContainerDetailsDto } from '@/providers/infrastructure/docker';
import { ResourceControlViewModel } from '@/react/portainer/access-control/models/ResourceControlViewModel';

import type { ContainerDetails } from '../models';

type ResourceControlResponse = ConstructorParameters<
  typeof ResourceControlViewModel
>[0];

export function toContainerDetails(
  response: DockerContainerDetailsDto
): ContainerDetails {
  const resourceControl = response.Portainer?.ResourceControl;

  return {
    ...response,
    ResourceControl: isResourceControlResponse(resourceControl)
      ? new ResourceControlViewModel(resourceControl)
      : undefined,
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
