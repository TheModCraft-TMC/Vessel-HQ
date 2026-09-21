import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { TagId } from '@/portainer/tags/types';
import {
  mutationOptions,
  withError,
  withInvalidate,
} from '@/core/query/query-client';
import { EnvironmentId } from '@/features/environments';

import { EdgeGroup } from '../types';

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
