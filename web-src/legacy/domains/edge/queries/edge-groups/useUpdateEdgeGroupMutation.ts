import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  edgeAgentClient as axios,
  parseAxiosError,
} from '@/providers/infrastructure/edge-agent';
import { TagId } from '@/domains/tags';
import { mutationOptions, withError, withInvalidate } from '@/core/query';
import { EnvironmentId } from '@/domains/environments';

import { EdgeGroup } from '../../models/edge-group';

import { buildUrl } from './build-url';
import { queryKeys } from './query-keys';

interface UpdateGroupPayload {
  id: EdgeGroup['Id'];
  name: string;
  dynamic: boolean;
  tagIds?: TagId[];
  endpoints?: EnvironmentId[];
  partialMatch?: boolean;
}

export async function updateEdgeGroup({
  id,
  ...requestPayload
}: UpdateGroupPayload) {
  try {
    const { data: group } = await axios.put<EdgeGroup>(
      buildUrl({ id }),
      requestPayload
    );
    return group;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Failed to update Edge group');
  }
}

export function useUpdateEdgeGroupMutation() {
  const queryClient = useQueryClient();

  return useMutation(
    updateEdgeGroup,
    mutationOptions(
      withError('Failed to update Edge group'),
      withInvalidate(queryClient, [queryKeys.base()])
    )
  );
}
