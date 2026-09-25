import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  edgeAgentClient as axios,
  parseAxiosError,
} from '@/providers/infrastructure/edge-agent';
import { TagId } from '@/domains/tags';
import { mutationOptions, withError, withInvalidate } from '@/core/query';
import { EnvironmentId } from '@/domains/environments';
import { EdgeGroup } from '@/domains/edge/models/edge-group';

import { buildUrl } from './build-url';
import { queryKeys } from './query-keys';

interface CreateGroupPayload {
  name: string;
  dynamic: boolean;
  tagIds?: TagId[];
  endpoints?: EnvironmentId[];
  partialMatch?: boolean;
}

export async function createEdgeGroup(requestPayload: CreateGroupPayload) {
  try {
    const { data: group } = await axios.post<EdgeGroup>(
      buildUrl(),
      requestPayload
    );
    return group;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Failed to create Edge group');
  }
}

export function useCreateEdgeGroupMutation() {
  const queryClient = useQueryClient();

  return useMutation(
    createEdgeGroup,
    mutationOptions(
      withError('Failed to create Edge group'),
      withInvalidate(queryClient, [queryKeys.base()])
    )
  );
}
