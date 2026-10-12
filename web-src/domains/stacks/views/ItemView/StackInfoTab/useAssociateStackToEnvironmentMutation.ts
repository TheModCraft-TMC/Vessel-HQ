import { useMutation } from '@tanstack/react-query';

import PortainerError from '@/shared/errors';
import { applyResourceControl } from '@/domains/access-control';
import { AccessControlFormData } from '@/domains/access-control';
import axios from '@/shared/http';
import { buildStackUrl } from '@/domains/stacks/queries/common/buildUrl';
import { Stack } from '@/domains/stacks/models/types';
import { withError } from '@/core/query';

export function useAssociateStackToEnvironmentMutation() {
  return useMutation({
    mutationFn: associateStackToEnvironmentMutation,
    ...withError('Failed to associate stack to environment'),
  });
}

async function associateStackToEnvironmentMutation({
  environmentId,
  stackId,
  isOrphanedRunning,
  accessControl,
  swarmId,
}: {
  environmentId: number;
  stackId: number;
  isOrphanedRunning?: boolean;
  accessControl: AccessControlFormData;
  swarmId?: string;
}) {
  const associatedStack = await associate({
    environmentId,
    stackId,
    isOrphanedRunning,
    swarmId,
  });

  const resourceControl = associatedStack.ResourceControl;
  if (!resourceControl) {
    throw new PortainerError('resource control expected after creation');
  }

  await applyResourceControl(accessControl, resourceControl.Id);
}

async function associate({
  environmentId,
  stackId,
  isOrphanedRunning,
  swarmId,
}: {
  environmentId: number;
  stackId: number;
  isOrphanedRunning?: boolean;
  swarmId?: string;
}) {
  const { data } = await axios.put<Stack>(
    buildStackUrl(stackId, 'associate'),
    {},
    {
      params: {
        endpointId: environmentId,
        orphanedRunning: isOrphanedRunning ?? false,
        swarmId,
      },
    }
  );

  return data;
}
